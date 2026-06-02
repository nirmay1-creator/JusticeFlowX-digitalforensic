/* ===========================
   METADATA ANALYSIS JS
   =========================== */

const uploadZone = document.getElementById('uploadZone');
const docUpload = document.getElementById('docUpload');
const uploadPreview = document.getElementById('uploadPreview');
const previewImg = document.getElementById('previewImg');
const uploadInfo = document.getElementById('uploadInfo');
const analyzeBtn = document.getElementById('analyzeBtn');
const rpWaiting = document.getElementById('rpWaiting');
const rpScanning = document.getElementById('rpScanning');
const rpResults = document.getElementById('rpResults');
const metadataViz = document.getElementById('metadataViz');

let uploadedFile = null;

// Drag & Drop
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f) handleFile(f);
});
uploadZone.addEventListener('click', () => docUpload.click());
docUpload.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });

function handleFile(file) {
  uploadedFile = file;
  // Show preview
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      uploadZone.style.display = 'none';
      uploadPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    uploadZone.style.display = 'none';
    uploadPreview.style.display = 'none';
  }
  // Fill info
  document.getElementById('uFileName').textContent = file.name;
  document.getElementById('uFileSize').textContent = (file.size / 1024).toFixed(1) + ' KB';
  document.getElementById('uFileType').textContent = file.type || 'Unknown';
  document.getElementById('uFileDate').textContent = new Date(file.lastModified).toLocaleDateString();
  uploadInfo.style.display = 'block';
  analyzeBtn.disabled = false;
}

// Analysis flow
analyzeBtn.addEventListener('click', runAnalysis);

function runAnalysis() {
  if (!uploadedFile) return;
  rpWaiting.style.display = 'none';
  rpResults.style.display = 'none';
  rpScanning.style.display = 'flex';
  metadataViz.style.display = 'none';

  const steps = [
    'Extracting EXIF metadata...',
    'Analyzing pixel integrity...',
    'Checking DPI consistency...',
    'Scanning font signatures...',
    'Detecting copy-paste artifacts...',
    'Verifying hologram patterns...',
    'Cross-referencing AI forgery model...',
    'Generating forensic report...'
  ];

  const stepsEl = document.getElementById('scanningSteps');
  const barFill = document.getElementById('scanningBarFill');
  const pct = document.getElementById('scanningPct');

  let i = 0;
  const total = steps.length;
  const interval = setInterval(() => {
    if (i < total) {
      stepsEl.textContent = steps[i];
      const p = Math.round(((i + 1) / total) * 100);
      barFill.style.width = p + '%';
      pct.textContent = p + '%';
      i++;
    } else {
      clearInterval(interval);
      setTimeout(showResults, 400);
    }
  }, 420);
}

function showResults() {
  rpScanning.style.display = 'none';
  rpResults.style.display = 'block';

  // Generate pseudo-forensic results based on file
  const fileSize = uploadedFile ? uploadedFile.size : 50000;
  const seed = fileSize % 100;
  const forgeryScore = Math.min(95, Math.max(5, (seed * 0.7 + Math.random() * 30)));
  const isForged = forgeryScore > 55;
  const isSuspect = forgeryScore > 35 && !isForged;

  // Verdict
  const verdict = document.getElementById('resultVerdict');
  if (isForged) {
    verdict.className = 'result-verdict rv-forged';
    verdict.innerHTML = `<i class='bx bx-x-circle'></i> FORGERY DETECTED — DOCUMENT FLAGGED`;
  } else if (isSuspect) {
    verdict.className = 'result-verdict rv-suspect';
    verdict.innerHTML = `<i class='bx bx-error'></i> SUSPICIOUS — MANUAL REVIEW REQUIRED`;
  } else {
    verdict.className = 'result-verdict rv-clean';
    verdict.innerHTML = `<i class='bx bx-check-shield'></i> METADATA ANALYSIS CLEAN`;
  }

  // Score bar
  const rsForgeryBar = document.getElementById('rsForgeryBar');
  const rsForgeryPct = document.getElementById('rsForgeryPct');
  const pctVal = Math.round(forgeryScore);
  rsForgeryPct.textContent = pctVal + '%';
  rsForgeryPct.style.color = pctVal > 55 ? 'var(--red)' : pctVal > 35 ? 'var(--warn)' : 'var(--green)';
  const barColor = pctVal > 55 ? 'linear-gradient(90deg, #ff2b5e, #ff6b8a)' : pctVal > 35 ? 'linear-gradient(90deg, #ffb800, #ffdd00)' : 'linear-gradient(90deg, #00ff88, #00ccaa)';
  rsForgeryBar.style.background = barColor;
  rsForgeryBar.style.boxShadow = `0 0 8px ${pctVal > 55 ? 'rgba(255,43,94,0.5)' : pctVal > 35 ? 'rgba(255,184,0,0.5)' : 'rgba(0,255,136,0.5)'}`;
  setTimeout(() => rsForgeryBar.style.width = pctVal + '%', 100);

  // Checks
  const checks = [
    { label: 'File Creation Date', icon: 'bx-time', pass: seed > 40, detail: seed > 40 ? 'Consistent' : 'ANOMALY: Future timestamp' },
    { label: 'DPI Consistency', icon: 'bx-scan', pass: seed > 30, detail: seed > 30 ? '300 DPI — Standard' : 'ANOMALY: Mixed 72/300 DPI' },
    { label: 'Font Signatures', icon: 'bx-font', pass: seed > 50, detail: seed > 50 ? 'Government font matched' : 'ANOMALY: Non-standard typeface' },
    { label: 'Pixel Integrity', icon: 'bx-image', pass: seed > 35, detail: seed > 35 ? 'No manipulation detected' : 'ANOMALY: Clone stamp artifacts' },
    { label: 'Copy-Paste Artifacts', icon: 'bx-copy', pass: seed > 45, detail: seed > 45 ? 'No artifacts found' : 'ANOMALY: Pasted layer detected' },
    { label: 'Hologram Alignment', icon: 'bx-cube', pass: seed > 25, detail: seed > 25 ? 'Security hologram intact' : 'ANOMALY: Hologram misaligned' }
  ];

  const checksEl = document.getElementById('resultChecks');
  checksEl.innerHTML = checks.map(c => `
    <div class="rc-item">
      <i class='bx ${c.icon}' style="color:${c.pass ? 'var(--green)' : 'var(--red)'}"></i>
      <span class="rc-label">${c.label}</span>
      <span class="rc-status" style="color:${c.pass ? 'var(--green)' : 'var(--red)'}">${c.pass ? 'PASS' : 'FAIL'}</span>
    </div>
  `).join('');

  // Details
  const detailsEl = document.getElementById('resultDetails');
  const exifDate = isForged ? '2087-03-15T14:22:00' : '2024-11-02T09:14:33';
  const modDate = isForged ? '2026-01-08T22:45:11' : '2024-11-02T09:14:33';
  detailsEl.innerHTML = `
    <div class="rd-title">DETAILED METADATA REPORT</div>
    <div class="rd-row"><span class="rd-key">EXIF Create Date</span><span class="rd-val ${isForged ? 'anomaly' : 'ok'}">${exifDate}</span></div>
    <div class="rd-row"><span class="rd-key">Last Modified</span><span class="rd-val ${isForged ? 'anomaly' : 'ok'}">${modDate}</span></div>
    <div class="rd-row"><span class="rd-key">Software Signature</span><span class="rd-val ${isForged ? 'anomaly' : 'ok'}">${isForged ? 'Adobe Photoshop 25.0' : 'Canon EOS R5 Firmware'}</span></div>
    <div class="rd-row"><span class="rd-key">Color Profile</span><span class="rd-val">${isForged ? 'sRGB (modified)' : 'AdobeRGB 1998'}</span></div>
    <div class="rd-row"><span class="rd-key">Image Dimensions</span><span class="rd-val">2480 × 3508 px</span></div>
    <div class="rd-row"><span class="rd-key">Compression Ratio</span><span class="rd-val ${isSuspect ? 'anomaly' : ''}">${isSuspect ? '3.2:1 (unusual)' : '8.1:1 (standard)'}</span></div>
    <div class="rd-row"><span class="rd-key">GPS Coordinates</span><span class="rd-val ${isForged ? 'anomaly' : ''}">${isForged ? 'STRIPPED — Suspicious' : 'Not embedded'}</span></div>
  `;

  // Show viz
  metadataViz.style.display = 'block';
  buildMetadataViz(forgeryScore, isForged, seed);
}

function buildMetadataViz(score, isForged, seed) {
  const grid = document.getElementById('mvizGrid');
  const metrics = [
    { label: 'DPI Score', val: isForged ? (seed % 200 + 100) : 300, unit: 'dpi', normal: '300', anomaly: isForged, bar: isForged ? 40 : 100, color: isForged ? 'var(--red)' : 'var(--green)' },
    { label: 'Compression', val: isForged ? (2 + Math.random() * 4).toFixed(1) : (7 + Math.random() * 3).toFixed(1), unit: ':1', normal: '8:1', anomaly: isForged && Math.random() > 0.4, bar: isForged ? 30 : 85, color: isForged ? 'var(--warn)' : 'var(--green)' },
    { label: 'Pixel Variance', val: isForged ? (Math.random() * 30 + 60).toFixed(0) : (Math.random() * 10 + 5).toFixed(0), unit: '%', normal: '<15%', anomaly: isForged, bar: isForged ? 80 : 20, color: isForged ? 'var(--red)' : 'var(--green)' },
    { label: 'Font Match', val: isForged ? (Math.random() * 30 + 40).toFixed(0) : (Math.random() * 15 + 85).toFixed(0), unit: '%', normal: '>85%', anomaly: isForged, bar: isForged ? 50 : 92, color: isForged ? 'var(--red)' : 'var(--green)' },
    { label: 'Layer Count', val: isForged ? (Math.floor(Math.random() * 5) + 3) : 1, unit: '', normal: '1', anomaly: isForged && Math.random() > 0.3, bar: isForged ? 70 : 10, color: isForged ? 'var(--warn)' : 'var(--green)' },
    { label: 'ELA Score', val: (score * 0.8 + Math.random() * 10).toFixed(0), unit: '%', normal: '<20%', anomaly: isForged, bar: score * 0.8, color: score > 40 ? 'var(--red)' : 'var(--green)' },
    { label: 'Color Depth', val: 24, unit: ' bit', normal: '24', anomaly: false, bar: 100, color: 'var(--green)' },
    { label: 'Entropy', val: isForged ? (6 + Math.random()).toFixed(2) : (7.5 + Math.random() * 0.4).toFixed(2), unit: '', normal: '7.5+', anomaly: isForged, bar: isForged ? 60 : 95, color: isForged ? 'var(--warn)' : 'var(--green)' }
  ];

  grid.innerHTML = metrics.map(m => `
    <div class="mviz-cell ${m.anomaly ? 'mviz-anomaly' : ''}">
      <div class="mviz-cell-label">${m.label.toUpperCase()}</div>
      <div class="mviz-cell-val" style="color:${m.color}">${m.val}${m.unit}</div>
      <div class="mviz-cell-detail">Expected: ${m.normal}</div>
      <div class="mviz-bar" style="width:${m.bar}%;background:${m.color};box-shadow:0 0 6px ${m.color}4d;transition:width 1.2s ease 0.2s"></div>
    </div>
  `).join('');
}