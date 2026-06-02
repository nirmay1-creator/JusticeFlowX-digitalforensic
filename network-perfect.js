/* ===== TOO PERFECT FLAG / WEAR ANALYSIS JS ===== */

const wearAnalyzeBtn = document.getElementById('wearAnalyzeBtn');
const wearUploadZone = document.getElementById('wearUploadZone');
const wearFileInput = document.getElementById('wearFileInput');
const wearPreviewWrap = document.getElementById('wearPreviewWrap');
const wearCanvas = document.getElementById('wearCanvas');

let uploadedImg = null, imgData = null;
let currentMode = 'normal';

// Upload handling
wearUploadZone && wearUploadZone.addEventListener('click', () => wearFileInput && wearFileInput.click());
wearFileInput && wearFileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    uploadedImg = new Image();
    uploadedImg.onload = () => {
      wearUploadZone.style.display = 'none';
      wearPreviewWrap.style.display = 'block';
      renderMode('normal');
    };
    uploadedImg.src = ev.target.result;
  };
  reader.readAsDataURL(f);
});

// View mode buttons
document.querySelectorAll('.wp-ctrl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wp-ctrl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.getAttribute('data-mode');
    renderMode(currentMode);
  });
});

function renderMode(mode) {
  const canvas = wearCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (uploadedImg) {
    ctx.drawImage(uploadedImg, 0, 0, W, H);
    const id = ctx.getImageData(0, 0, W, H);
    imgData = id;

    if (mode === 'enhanced') {
      // Boost contrast
      for (let i = 0; i < id.data.length; i += 4) {
        id.data[i] = Math.min(255, (id.data[i] - 128) * 1.8 + 128);
        id.data[i+1] = Math.min(255, (id.data[i+1] - 128) * 1.8 + 128);
        id.data[i+2] = Math.min(255, (id.data[i+2] - 128) * 1.8 + 128);
      }
      ctx.putImageData(id, 0, 0);
    } else if (mode === 'wear') {
      // Heat map overlay for wear zones
      ctx.globalAlpha = 0.6;
      const gradient = ctx.createRadialGradient(20, 20, 2, 20, 20, 60);
      gradient.addColorStop(0, 'rgba(255,43,94,0.7)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createRadialGradient(W - 20, H - 20, 2, W - 20, H - 20, 50);
      g2.addColorStop(0, 'rgba(255,43,94,0.5)'); g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      // Label
      ctx.font = '9px Share Tech Mono'; ctx.fillStyle = 'rgba(255,43,94,0.8)';
      ctx.fillText('WEAR ZONES', 8, 90); ctx.fillText('HIGHLIGHTED', 8, 102);
    } else if (mode === 'edge') {
      // Greyscale + edge effect
      for (let i = 0; i < id.data.length; i += 4) {
        const avg = (id.data[i] + id.data[i+1] + id.data[i+2]) / 3;
        id.data[i] = avg; id.data[i+1] = avg; id.data[i+2] = avg;
      }
      ctx.putImageData(id, 0, 0);
      ctx.strokeStyle = 'rgba(0,245,255,0.4)'; ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
  } else {
    // Demo: draw a simulated ID card
    drawSimID(ctx, W, H, mode);
  }
}

function drawSimID(ctx, W, H, mode) {
  ctx.fillStyle = '#1a2540'; ctx.fillRect(0, 0, W, H);
  ctx.font = 'bold 12px Rajdhani'; ctx.fillStyle = 'rgba(200,230,255,0.9)';
  ctx.fillText('NATIONAL IDENTITY CARD', 12, 22);
  ctx.font = '9px Share Tech Mono'; ctx.fillStyle = 'rgba(150,200,240,0.5)';
  ctx.fillText('Upload your document to analyze', 12, 40);
}

// ANALYZE
wearAnalyzeBtn && wearAnalyzeBtn.addEventListener('click', runWearAnalysis);

function runWearAnalysis() {
  const docType = document.getElementById('wearDocType').value;
  const issueYear = parseInt(document.getElementById('wearIssueYear').value);
  const usage = document.getElementById('wearUsage').value;
  const storage = document.getElementById('wearStorage').value;

  if (!issueYear || issueYear < 1990 || issueYear > 2026) {
    alert('Please enter a valid issue year (1990–2026)');
    return;
  }

  const docAge = 2026 - issueYear;
  document.getElementById('wrpWaiting').style.display = 'none';
  document.getElementById('wrpResults').style.display = 'none';
  document.getElementById('wrpScanning').style.display = 'flex';

  const scanSteps = [
    'Scanning laminate surface texture...',
    'Analyzing corner wear patterns...',
    'Checking crease distribution...',
    'Measuring print fade index...',
    'Detecting edge abrasion...',
    'Comparing against ' + docAge + '-year reference database...',
    'Running "Too Perfect" AI model...',
    'Generating aging score...'
  ];
  const stepsEl = document.getElementById('wsaSteps');
  const markers = document.getElementById('wsaMarkers');
  let si = 0;
  const iv = setInterval(() => {
    if (si < scanSteps.length) {
      stepsEl.textContent = scanSteps[si];
      // Add scan marker
      const m = document.createElement('div');
      m.className = 'wsa-marker';
      m.style.left = (10 + Math.random() * 80) + '%';
      m.style.top = (10 + Math.random() * 80) + '%';
      const markerColors = ['#00ff88', '#ffb800', '#ff2b5e'];
      const mc = markerColors[Math.floor(Math.random() * markerColors.length)];
      m.style.borderColor = mc; m.style.boxShadow = `0 0 6px ${mc}`;
      if (markers) markers.appendChild(m);
      si++;
    } else {
      clearInterval(iv);
      setTimeout(() => {
        document.getElementById('wrpScanning').style.display = 'none';
        showWearResults(docAge, usage, storage, docType);
      }, 400);
    }
  }, 360);
}

function calcWearScore(docAge, usage, storage) {
  // Expected wear: higher age + heavier usage = more expected wear
  const expectedWear = Math.min(95, docAge * 3 + (usage === 'heavy' ? 25 : usage === 'moderate' ? 15 : usage === 'light' ? 5 : 0) + (storage === 'wallet' ? 20 : storage === 'bag' ? 10 : 0));
  return expectedWear;
}

function showWearResults(docAge, usage, storage, docType) {
  document.getElementById('wrpResults').style.display = 'block';
  document.getElementById('wgAge').textContent = docAge;

  const expectedWear = calcWearScore(docAge, usage, storage);
  // Simulate actual measured condition (random but biased by upload presence)
  const seed = docAge * 7 + (usage === 'heavy' ? 3 : 1);
  const measuredCondition = uploadedImg
    ? Math.max(10, Math.min(99, 100 - expectedWear * 0.6 + (seed % 20) - 10))
    : Math.max(10, Math.min(99, 100 - expectedWear * 0.4 + (seed % 30)));

  document.getElementById('wgCondition').textContent = Math.round(measuredCondition);

  // "Too perfect" score = how much better condition is than expected
  const tooPerfectScore = Math.max(0, measuredCondition - (100 - expectedWear));
  const isTooPerfect = tooPerfectScore > 25 || (docAge > 7 && measuredCondition > 80);

  // Gauge
  drawWearGauge(docAge, measuredCondition, expectedWear, isTooPerfect);

  // Expected band text
  const expConditionRange = `${Math.max(10, Math.round(100 - expectedWear - 15))}–${Math.round(100 - expectedWear + 10)}`;
  document.getElementById('wgExpectedBand').innerHTML = `
    Expected condition for a ${docAge}-year-old ${docType.replace('_', ' ')} with ${usage} usage: <strong style="color:var(--cyan)">${expConditionRange}%</strong>
    &nbsp;|&nbsp; Measured: <strong style="color:${isTooPerfect ? 'var(--red)' : 'var(--green)'}">${Math.round(measuredCondition)}%</strong>
    ${isTooPerfect ? `&nbsp;<span style="color:var(--red);font-family:var(--font-mono);font-size:10px">⚠ SUSPICIOUSLY HIGH</span>` : ''}
  `;

  // Checks
  buildWearChecks(docAge, measuredCondition, expectedWear, isTooPerfect, usage, storage);

  // Verdict
  const verdict = document.getElementById('wearVerdict');
  if (isTooPerfect && docAge > 5) {
    verdict.style.cssText = 'background:rgba(255,43,94,0.08);border-color:rgba(255,43,94,0.3);color:var(--red)';
    verdict.innerHTML = `<i class='bx bx-error-circle' style="font-size:28px"></i> 🚨 "TOO PERFECT" FLAG TRIGGERED — This ${docAge}-year-old document shows ${Math.round(measuredCondition)}% condition, far above expected ${expConditionRange}% for its age and usage. Likely a FORGERY or RECENT REPRINT.`;
  } else if (tooPerfectScore > 10) {
    verdict.style.cssText = 'background:rgba(255,184,0,0.08);border-color:rgba(255,184,0,0.3);color:var(--warn)';
    verdict.innerHTML = `<i class='bx bx-error' style="font-size:28px"></i> ⚠ SLIGHT PERFECTION ANOMALY — Document is ${Math.round(tooPerfectScore)}% better than expected. Minor concern. Proceed with secondary checks.`;
  } else {
    verdict.style.cssText = 'background:rgba(0,255,136,0.08);border-color:rgba(0,255,136,0.3);color:var(--green)';
    verdict.innerHTML = `<i class='bx bx-check-shield' style="font-size:28px"></i> ✓ WEAR PATTERN AUTHENTIC — Document aging is consistent with ${docAge} years of ${usage} use. No "too perfect" anomaly detected.`;
  }

  // Reference section
  document.getElementById('wearRefSection').style.display = 'block';
  drawReferenceCanvases(docAge, measuredCondition, isTooPerfect);
}

function drawWearGauge(docAge, measured, expected, isTooPerfect) {
  const canvas = document.getElementById('wearGaugeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 200, 130);
  const cx = 100, cy = 110, r = 80;

  // Draw arc background
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.strokeStyle = 'rgba(0,245,255,0.1)'; ctx.lineWidth = 12; ctx.stroke();

  // Expected range band
  const expLow = (100 - expected - 15) / 100;
  const expHigh = (100 - expected + 10) / 100;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI + Math.PI * expLow, Math.PI + Math.PI * expHigh);
  ctx.strokeStyle = 'rgba(0,255,136,0.3)'; ctx.lineWidth = 14; ctx.stroke();

  // Measured needle
  const pct = Math.min(measured / 100, 1);
  const color = isTooPerfect ? '#ff2b5e' : '#00ff88';
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * pct);
  ctx.strokeStyle = color; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.shadowBlur = 10; ctx.shadowColor = color; ctx.stroke(); ctx.shadowBlur = 0;

  // Label
  const label = isTooPerfect ? 'TOO PERFECT' : measured < 40 ? 'HEAVY WEAR' : measured < 70 ? 'NORMAL WEAR' : 'LIGHT WEAR';
  const scoreLabel = document.getElementById('wgScoreLabel');
  if (scoreLabel) { scoreLabel.textContent = label; scoreLabel.style.color = color; }
}

function buildWearChecks(docAge, measured, expected, isTooPerfect, usage, storage) {
  const grid = document.getElementById('wearChecksGrid');
  const checks = [
    {
      icon: 'bx-border-none', label: 'Corner Wear',
      pass: !(isTooPerfect && docAge > 5),
      score: isTooPerfect ? 95 : Math.max(10, 100 - docAge * 3),
      detail: isTooPerfect && docAge > 5 ? 'Corners too sharp for ' + docAge + ' years' : 'Wear consistent with age'
    },
    {
      icon: 'bx-layer', label: 'Laminate Integrity',
      pass: !(isTooPerfect && docAge > 7),
      score: isTooPerfect ? 99 : Math.max(20, 100 - docAge * 2),
      detail: isTooPerfect && docAge > 7 ? 'Laminate pristine — suspicious' : 'Expected laminate condition'
    },
    {
      icon: 'bx-move-horizontal', label: 'Crease Lines',
      pass: !isTooPerfect,
      score: isTooPerfect ? 98 : Math.max(15, 100 - docAge * 4),
      detail: isTooPerfect ? 'ZERO creases on ' + docAge + '-year-old doc' : docAge + ' years of natural creasing'
    },
    {
      icon: 'bx-font-color', label: 'Print Fade Index',
      pass: !(isTooPerfect && docAge > 6),
      score: isTooPerfect ? 97 : Math.max(25, 100 - docAge * 3.5),
      detail: isTooPerfect ? 'Print too sharp — no UV fade' : 'Ink fade consistent with age'
    },
    {
      icon: 'bx-droplet', label: 'Surface Abrasion',
      pass: !(isTooPerfect && usage === 'heavy'),
      score: isTooPerfect ? 96 : Math.max(30, 100 - docAge * 2.5),
      detail: isTooPerfect && usage === 'heavy' ? 'No abrasion despite claimed heavy use' : 'Abrasion matches usage pattern'
    },
    {
      icon: 'bx-photo-album', label: 'Photo Boundary',
      pass: !(isTooPerfect && docAge > 8),
      score: isTooPerfect ? 99 : Math.max(20, 100 - docAge * 2),
      detail: isTooPerfect ? 'Photo edges suspiciously clean' : 'Natural photo boundary aging'
    }
  ];

  grid.innerHTML = checks.map(c => {
    const barColor = c.pass ? 'var(--green)' : 'var(--red)';
    const scoreColor = c.score > 85 && !c.pass ? 'var(--red)' : c.score > 85 ? 'var(--warn)' : 'var(--green)';
    return `<div class="wc-item">
      <div class="wc-header">
        <i class='bx ${c.icon} wc-icon' style="color:${c.pass ? 'var(--green)' : 'var(--red)'}"></i>
        <span class="wc-label">${c.label}</span>
        <span class="wc-result" style="color:${c.pass ? 'var(--green)' : 'var(--red)'}">${c.pass ? 'OK' : 'FLAG'}</span>
      </div>
      <div class="wc-bar-wrap">
        <div class="wc-bar-fill" style="width:${c.score}%;background:${barColor};box-shadow:0 0 6px ${barColor}4d"></div>
      </div>
      <div class="wc-detail">${c.detail}</div>
    </div>`;
  }).join('');
}

function drawReferenceCanvases(docAge, measured, isTooPerfect) {
  drawDocCanvas('wrsCanvas1', docAge, 'genuine');
  drawDocCanvas('wrsCanvas2', docAge, isTooPerfect ? 'tooperfect' : 'genuine');
  drawDocCanvas('wrsCanvas3', docAge, 'forged');

  const desc2 = document.getElementById('wrsDesc2');
  if (desc2) {
    desc2.style.color = isTooPerfect ? 'var(--red)' : 'var(--green)';
    desc2.textContent = isTooPerfect
      ? `⚠ Condition score ${Math.round(measured)}% — matches forgery pattern. Too pristine for ${docAge}-year-old document.`
      : `✓ Condition score ${Math.round(measured)}% — within expected range for ${docAge}-year-old document. Authentic wear pattern.`;
  }
}

function drawDocCanvas(id, docAge, type) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const baseColor = type === 'forged' || type === 'tooperfect' ? '#1a2540' : '#172035';
  ctx.fillStyle = baseColor; ctx.fillRect(0, 0, W, H);

  // Draw ID card structure
  ctx.strokeStyle = 'rgba(100,160,220,0.2)'; ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  if (type === 'genuine') {
    // Add wear: corner darkening
    const corners = [[0,0],[W,0],[0,H],[W,H]];
    corners.forEach(([cx, cy]) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
      g.addColorStop(0, 'rgba(0,0,0,0.5)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    // Random scratches
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      const sx = Math.random() * W, sy = Math.random() * H;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 30);
      ctx.stroke();
    }
    // Faded print
    ctx.font = '7px Share Tech Mono';
    ctx.fillStyle = 'rgba(150,200,240,0.4)';
    ctx.fillText('NAME: ██████ (faded)', 10, 30);
    ctx.fillStyle = 'rgba(120,160,200,0.3)';
    ctx.fillText('DOB: ██/██/████', 10, 44);
    // Crease lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2 + 5, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H/2 - 5); ctx.lineTo(W, H/2); ctx.stroke();
    // Label
    ctx.font = 'bold 9px Rajdhani';
    ctx.fillStyle = 'rgba(0,255,136,0.6)';
    ctx.fillText('NATURAL AGING', 10, H - 10);
  } else if (type === 'tooperfect' || type === 'forged') {
    // Pristine document — too clean
    ctx.font = '8px Share Tech Mono';
    ctx.fillStyle = 'rgba(200,230,255,0.9)';
    ctx.fillText('NAME: SUBJECT NAME', 10, 30);
    ctx.fillStyle = 'rgba(180,210,240,0.8)';
    ctx.fillText('DOB: 01/01/1990', 10, 44);
    // Perfect edges
    ctx.strokeStyle = 'rgba(0,245,255,0.3)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(3, 3, W - 6, H - 6);
    // Hologram (too perfect)
    const hg = ctx.createRadialGradient(W - 30, 30, 0, W - 30, 30, 20);
    hg.addColorStop(0, 'rgba(0,245,255,0.2)');
    hg.addColorStop(0.5, 'rgba(123,47,255,0.15)');
    hg.addColorStop(1, 'transparent');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
    // Label
    ctx.font = 'bold 9px Rajdhani';
    ctx.fillStyle = 'rgba(255,43,94,0.7)';
    ctx.fillText('⚠ NO WEAR DETECTED', 10, H - 10);
  }
}