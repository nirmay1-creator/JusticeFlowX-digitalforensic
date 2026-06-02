/* ===========================
   INK & PAPER ANALYSIS JS
   =========================== */

const uvToggle = document.getElementById('uvToggle');
const uvKnob = document.getElementById('uvKnob');
const uvLabel = document.getElementById('uvLabel');
const uvsFill = document.getElementById('uvsFill');
const uvsVal = document.getElementById('uvsVal');
const simIdCard = document.getElementById('simIdCard');
const runInkBtn = document.getElementById('runInkBtn');
const inkCheckList = document.getElementById('inkCheckList');
const inkVerdictBox = document.getElementById('inkVerdictBox');
const microprintSection = document.getElementById('microprintSection');

let uvActive = false;
let uvAnimFrame = null;
let uvLevel = 0;

// UV Toggle
uvToggle.addEventListener('click', () => {
  uvActive = !uvActive;
  uvToggle.classList.toggle('active', uvActive);
  uvLabel.textContent = uvActive ? 'UV ON' : 'UV OFF';
  if (uvActive) {
    animateUV(true);
    simIdCard.classList.add('uv-active');
  } else {
    animateUV(false);
    simIdCard.classList.remove('uv-active');
  }
});

function animateUV(on) {
  if (uvAnimFrame) cancelAnimationFrame(uvAnimFrame);
  const target = on ? 365 : 0;
  const start = uvLevel;
  const t0 = performance.now();
  const dur = 1200;
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 2);
    uvLevel = start + (target - start) * eased;
    uvsFill.style.width = (uvLevel / 365 * 100) + '%';
    uvsVal.textContent = Math.round(uvLevel) + ' nm';
    if (p < 1) uvAnimFrame = requestAnimationFrame(step);
  }
  uvAnimFrame = requestAnimationFrame(step);
}

// Barcode lines gen
const bcLines = document.getElementById('bcLines');
if (bcLines) {
  let bc = '';
  for (let i = 0; i < 60; i++) {
    const w = Math.random() > 0.5 ? 2 : 1;
    const gap = Math.floor(Math.random() * 4) + 1;
    bc += `<div style="display:inline-block;width:${w}px;height:24px;background:rgba(200,220,255,0.8);margin-right:${gap}px;vertical-align:top"></div>`;
  }
  bcLines.innerHTML = bc;
}

// Run ink analysis
runInkBtn.addEventListener('click', runInkAnalysis);

function runInkAnalysis() {
  const docType = document.getElementById('docTypeSelect').value;
  const country = document.getElementById('countrySelect').value;
  const year = parseInt(document.getElementById('issueYear').value);

  if (!docType || !country) {
    inkCheckList.innerHTML = '<div class="icl-placeholder" style="color:var(--warn)"><i class="bx bx-error"></i> Please fill in all fields</div>';
    return;
  }

  inkCheckList.innerHTML = '';
  inkVerdictBox.style.display = 'none';
  microprintSection.style.display = 'none';

  const seed = (docType.length + country.length + (year || 2022)) % 100;
  const checks = getInkChecks(docType, country, year, seed);

  let delay = 0;
  checks.forEach((check, i) => {
    setTimeout(() => {
      const item = document.createElement('div');
      item.className = 'ink-check-item';
      const pass = check.result === 'pass';
      const warn = check.result === 'warn';
      item.innerHTML = `
        <i class='bx ${check.icon}' style="color:${pass ? 'var(--green)' : warn ? 'var(--warn)' : 'var(--red)'}"></i>
        <span class="ici-label">${check.label}</span>
        <span class="ici-result" style="color:${pass ? 'var(--green)' : warn ? 'var(--warn)' : 'var(--red)'}">${check.detail}</span>
      `;
      inkCheckList.appendChild(item);

      if (i === checks.length - 1) {
        setTimeout(() => showInkVerdict(checks, seed), 400);
      }
    }, delay);
    delay += 280;
  });
}

function getInkChecks(docType, country, year, seed) {
  const isOld = year && year < 2015;
  const forgeSeed = seed > 60;

  return [
    {
      icon: 'bx-sun',
      label: 'UV-Reactive Ink Pattern',
      result: forgeSeed ? 'fail' : 'pass',
      detail: forgeSeed ? 'NO UV response — FAKE INK' : 'UV fluorescence confirmed'
    },
    {
      icon: 'bx-zoom-in',
      label: 'Microprinting Legibility',
      result: forgeSeed ? 'fail' : seed > 30 ? 'pass' : 'warn',
      detail: forgeSeed ? 'Microprint ABSENT' : seed > 30 ? '400x clear — authentic' : 'Partially degraded'
    },
    {
      icon: 'bx-layer',
      label: 'Paper Grade & Weight',
      result: forgeSeed ? 'fail' : 'pass',
      detail: forgeSeed ? 'Consumer paper (80g/m²) detected' : `${docType === 'passport' ? '110' : '100'}g/m² security paper confirmed`
    },
    {
      icon: 'bx-transfer-alt',
      label: 'Security Thread Detection',
      result: forgeSeed ? 'fail' : 'pass',
      detail: forgeSeed ? 'No embedded security thread' : 'Magnetic thread at position 28mm'
    },
    {
      icon: 'bx-barcode',
      label: 'Ink Jet Pattern Analysis',
      result: seed > 50 ? 'pass' : 'warn',
      detail: seed > 50 ? 'Intaglio print pattern confirmed' : 'Offset printing detected (borderline)'
    },
    {
      icon: 'bx-color',
      label: 'Color-Shifting Ink (OVI)',
      result: docType === 'passport' ? (forgeSeed ? 'fail' : 'pass') : 'pass',
      detail: docType === 'passport' && forgeSeed ? 'No color shift observed' : docType === 'passport' ? 'Gold-to-green shift confirmed' : 'N/A for this document type'
    },
    {
      icon: 'bx-ghost',
      label: 'Ghost Image Overlay',
      result: forgeSeed ? 'fail' : isOld ? 'warn' : 'pass',
      detail: forgeSeed ? 'No ghost image found' : isOld ? 'Pre-2015 — ghost image not standard' : 'Secondary portrait confirmed'
    },
    {
      icon: 'bx-water',
      label: 'Watermark Authenticity',
      result: forgeSeed ? 'fail' : 'pass',
      detail: forgeSeed ? 'Printed watermark — NOT genuine' : 'Embedded watermark verified'
    }
  ];
}

function showInkVerdict(checks, seed) {
  const fails = checks.filter(c => c.result === 'fail').length;
  const warns = checks.filter(c => c.result === 'warn').length;
  const isForged = fails >= 3;
  const isSuspect = fails >= 1 || warns >= 3;

  inkVerdictBox.style.display = 'block';
  const resultEl = document.getElementById('ivbResult');
  const confEl = document.getElementById('ivbConfidence');

  if (isForged) {
    resultEl.style.color = 'var(--red)';
    resultEl.textContent = '🚨 PHYSICALLY FORGED';
    confEl.textContent = `${fails} critical failures detected — 94% confidence forgery`;
  } else if (isSuspect) {
    resultEl.style.color = 'var(--warn)';
    resultEl.textContent = '⚠ SUSPICIOUS — REVIEW';
    confEl.textContent = `${warns} warnings detected — requires lab verification`;
  } else {
    resultEl.style.color = 'var(--green)';
    resultEl.textContent = '✓ INK & PAPER AUTHENTIC';
    confEl.textContent = 'All 8 checks passed — document appears genuine';
  }

  // Show microprint section
  microprintSection.style.display = 'block';
  drawMicroprintCanvases(isForged);
}

function drawMicroprintCanvases(isForged) {
  const canvases = ['mpzCanvas1', 'mpzCanvas2', 'mpzCanvas3', 'mpzCanvas4'];
  const results = ['mpzR1', 'mpzR2', 'mpzR3', 'mpzR4'];
  const zonePass = [!isForged, !isForged, Math.random() > 0.3, !isForged || Math.random() > 0.5];

  canvases.forEach((id, i) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 200, 80);

    if (zonePass[i]) {
      // Draw clean microtext
      ctx.font = '4px monospace';
      ctx.fillStyle = 'rgba(0,245,255,0.5)';
      for (let row = 0; row < 14; row++) {
        const text = 'AUTHENTIC DOCUMENT REPUBLIC OF INDIA JUSTICEFX ';
        ctx.fillText(text.repeat(3), 2, 6 + row * 5.5);
      }
      // Magnification grid
      ctx.strokeStyle = 'rgba(0,245,255,0.15)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < 200; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 80); ctx.stroke(); }
      for (let y = 0; y < 80; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(200, y); ctx.stroke(); }
    } else {
      // Draw blank/noisy (fake)
      for (let p = 0; p < 500; p++) {
        ctx.fillStyle = `rgba(${Math.random() * 100},${Math.random() * 100},${Math.random() * 100},0.8)`;
        ctx.fillRect(Math.random() * 200, Math.random() * 80, 1.5, 1.5);
      }
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255,43,94,0.4)';
      ctx.fillText('NO MICROPRINT DETECTED', 10, 45);
    }

    const rEl = document.getElementById(results[i]);
    if (rEl) {
      rEl.style.color = zonePass[i] ? 'var(--green)' : 'var(--red)';
      rEl.textContent = zonePass[i] ? '✓ MICROPRINT VERIFIED' : '✗ NO MICROPRINT';
    }
  });
}