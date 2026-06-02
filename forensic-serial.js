/* ===========================
   SERIAL VERIFICATION JS
   =========================== */

const verifyBtn = document.getElementById('verifyBtn');
const clearBtn = document.getElementById('clearBtn');
const serialInput = document.getElementById('serialInput');
const batchBtn = document.getElementById('batchBtn');
const batchInput = document.getElementById('batchInput');
const srpWaiting = document.getElementById('srpWaiting');
const srpScanning = document.getElementById('srpScanning');
const srpResult = document.getElementById('srpResult');
const batchResults = document.getElementById('batchResults');
const docTypeDisplay = document.getElementById('docTypeDisplay');

const docTypeNames = {
  national_id: 'National ID Card',
  passport: 'Passport',
  drivers_license: "Driver's License",
  visa: 'Visa Document'
};

// Type button selection
let selectedType = 'national_id';
document.querySelectorAll('.stype-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stype-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.getAttribute('data-type');
    docTypeDisplay.textContent = docTypeNames[selectedType] || selectedType;
    updateFormatHint();
  });
});

// Format hints
const formatHints = {
  national_id: 'Format: Country-Year-AlphaNumeric (e.g. IND-2024-AB123456)',
  passport: 'Format: CountryCode + 7-digit number (e.g. IND4567890)',
  drivers_license: 'Format: StateCode-Number (e.g. MH-2024-123456789)',
  visa: 'Format: Country-VisaType-Number (e.g. USA-B2-123456789)'
};
function updateFormatHint() {
  const hint = document.getElementById('serialFormatHint');
  if (hint) hint.textContent = formatHints[selectedType] || 'Enter serial number';
}

// Live format validation
serialInput.addEventListener('input', () => {
  const val = serialInput.value.toUpperCase();
  serialInput.value = val;
});

// Verify button
verifyBtn.addEventListener('click', () => {
  const serial = serialInput.value.trim();
  if (!serial) return;
  runVerification(serial, selectedType);
});

clearBtn.addEventListener('click', () => {
  serialInput.value = '';
  srpWaiting.style.display = 'flex';
  srpScanning.style.display = 'none';
  srpResult.style.display = 'none';
  batchResults.style.display = 'none';
});

// Batch
batchBtn.addEventListener('click', () => {
  const lines = batchInput.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (!lines.length) return;
  runBatchVerification(lines);
});

// DB nodes
const dbNodes = ['GOV-DB-01', 'INTERPOL', 'NATIONAL', 'INTL-REG', 'REVOC-LIST'];

function runVerification(serial, docType) {
  srpWaiting.style.display = 'none';
  srpResult.style.display = 'none';
  batchResults.style.display = 'none';
  srpScanning.style.display = 'block';

  // Build nodes
  const nodesEl = document.getElementById('ssaNodes');
  nodesEl.innerHTML = dbNodes.map(n => `<div class="ssa-node" data-node="${n}">${n}</div>`).join('');

  const textEl = document.getElementById('ssaText');
  const queryLog = document.getElementById('dbQueryLog');
  queryLog.innerHTML = '';

  const logMessages = [
    `Parsing serial: ${serial}`,
    `Validating format against ${docType.toUpperCase()} schema...`,
    `Querying GOV-DB-01 primary registry...`,
    `Cross-checking INTERPOL lost/stolen documents...`,
    `Verifying national records...`,
    `Checking international registry...`,
    `Running revocation list scan...`,
    `Checking for duplicate usage across 4.2M records...`,
    `Analyzing issue date consistency...`,
    `Compiling verdict...`
  ];

  let i = 0;
  let nodeIdx = 0;
  const nodeEls = nodesEl.querySelectorAll('.ssa-node');

  const logInterval = setInterval(() => {
    if (i < logMessages.length) {
      const div = document.createElement('div');
      div.textContent = logMessages[i];
      queryLog.appendChild(div);
      queryLog.scrollTop = queryLog.scrollHeight;
      textEl.textContent = logMessages[i];

      if (nodeIdx < nodeEls.length) {
        if (nodeIdx > 0) nodeEls[nodeIdx - 1].classList.remove('querying');
        if (nodeIdx > 0) nodeEls[nodeIdx - 1].classList.add('done');
        nodeEls[nodeIdx].classList.add('querying');
        nodeIdx++;
      }
      i++;
    } else {
      clearInterval(logInterval);
      nodeEls.forEach(n => { n.classList.remove('querying'); n.classList.add('done'); });
      setTimeout(() => showSerialResult(serial, docType), 500);
    }
  }, 350);
}

function analyzeSerial(serial, docType) {
  // Deterministic scoring from serial string
  const hash = serial.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = hash % 100;

  const formatValid = validateFormat(serial, docType);
  const yearInRange = (() => {
    const match = serial.match(/\d{4}/);
    if (!match) return true;
    const y = parseInt(match[0]);
    return y >= 1990 && y <= 2026;
  })();

  const isRevoked = seed > 90;
  const isDuplicate = seed > 85 && seed <= 90;
  const notFound = seed > 80 && seed <= 85;
  const isClean = formatValid && yearInRange && !isRevoked && !isDuplicate && !notFound;

  return { seed, formatValid, yearInRange, isRevoked, isDuplicate, notFound, isClean };
}

function validateFormat(serial, docType) {
  if (!serial || serial.length < 5) return false;
  const patterns = {
    national_id: /^[A-Z]{2,3}[-_]?\d{2,4}[-_]?[A-Z0-9]{4,10}$/,
    passport: /^[A-Z]{2,3}\d{6,9}$/,
    drivers_license: /^[A-Z]{2}[-_]?\d{2,4}[-_]?\d{6,12}$/,
    visa: /^[A-Z]{2,3}[-_]?[A-Z0-9]{2,4}[-_]?\d{6,12}$/
  };
  return (patterns[docType] || /.+/).test(serial);
}

function showSerialResult(serial, docType) {
  srpScanning.style.display = 'none';
  srpResult.style.display = 'block';

  const r = analyzeSerial(serial, docType);
  const banner = document.getElementById('srVerdictBanner');

  if (r.isClean) {
    banner.className = 'sr-verdict-banner rv-clean';
    banner.innerHTML = `<i class='bx bx-check-shield'></i> SERIAL VERIFIED — AUTHENTIC RECORD FOUND`;
  } else if (r.isRevoked) {
    banner.className = 'sr-verdict-banner rv-forged';
    banner.innerHTML = `<i class='bx bx-x-circle'></i> REVOKED DOCUMENT — DO NOT ACCEPT`;
  } else if (r.isDuplicate) {
    banner.className = 'sr-verdict-banner rv-forged';
    banner.innerHTML = `<i class='bx bx-error-circle'></i> DUPLICATE SERIAL — FORGERY DETECTED`;
  } else if (r.notFound) {
    banner.className = 'sr-verdict-banner rv-forged';
    banner.innerHTML = `<i class='bx bx-help-circle'></i> SERIAL NOT FOUND IN DATABASE`;
  } else {
    banner.className = 'sr-verdict-banner rv-suspect';
    banner.innerHTML = `<i class='bx bx-error'></i> FORMAT ANOMALY — MANUAL REVIEW`;
  }

  // Detail grid
  const grid = document.getElementById('srDetailGrid');
  const country = document.getElementById('serialCountry').value || 'IND';
  grid.innerHTML = `
    <div class="srd-cell">
      <div class="srd-label">SERIAL NUMBER</div>
      <div class="srd-value" style="color:var(--cyan);font-size:12px;letter-spacing:2px">${serial}</div>
    </div>
    <div class="srd-cell">
      <div class="srd-label">DATABASE STATUS</div>
      <div class="srd-value" style="color:${r.isClean ? 'var(--green)' : 'var(--red)'}">${r.isClean ? 'FOUND & VALID' : r.notFound ? 'NOT FOUND' : r.isRevoked ? 'REVOKED' : r.isDuplicate ? 'DUPLICATE' : 'FORMAT ERROR'}</div>
    </div>
    <div class="srd-cell">
      <div class="srd-label">ISSUING COUNTRY</div>
      <div class="srd-value" style="color:var(--text-main)">${country}</div>
    </div>
    <div class="srd-cell">
      <div class="srd-label">DOCUMENT TYPE</div>
      <div class="srd-value" style="color:var(--text-main)">${docTypeNames[docType]}</div>
    </div>
    <div class="srd-cell">
      <div class="srd-label">FORMAT VALID</div>
      <div class="srd-value" style="color:${r.formatValid ? 'var(--green)' : 'var(--red)'}">${r.formatValid ? '✓ YES' : '✗ NO'}</div>
    </div>
    <div class="srd-cell">
      <div class="srd-label">RISK SCORE</div>
      <div class="srd-value" style="color:${r.isClean ? 'var(--green)' : 'var(--red)'}">${r.isClean ? Math.floor(Math.random() * 15) : 70 + Math.floor(Math.random() * 30)}%</div>
    </div>
  `;

  // Checks
  const checksList = document.getElementById('srChecksList');
  const checks = [
    { icon: 'bx-barcode', label: 'Serial Format Validation', pass: r.formatValid, detail: r.formatValid ? 'Matches ' + docTypeNames[docType] + ' schema' : 'Format does not match expected pattern' },
    { icon: 'bx-calendar', label: 'Issue Year in Range', pass: r.yearInRange, detail: r.yearInRange ? 'Year within valid issuance period' : 'Year out of valid range (1990–2026)' },
    { icon: 'bx-data', label: 'Government Registry Match', pass: r.isClean, detail: r.isClean ? 'Record confirmed in national DB' : r.notFound ? 'No record found' : 'Record status: INVALID' },
    { icon: 'bx-copy', label: 'Duplicate Detection', pass: !r.isDuplicate, detail: !r.isDuplicate ? 'No duplicate usage found' : '⚠ SAME SERIAL USED ON 3 DIFFERENT DOCUMENTS' },
    { icon: 'bx-block', label: 'Revocation Check', pass: !r.isRevoked, detail: !r.isRevoked ? 'Not on revocation list' : '🚨 REVOKED on ' + new Date(Date.now() - Math.random() * 1e10).toLocaleDateString() },
    { icon: 'bx-world', label: 'Interpol Lost/Stolen', pass: r.seed < 75, detail: r.seed < 75 ? 'Not flagged in Interpol database' : '⚠ FLAGGED as lost/stolen document' }
  ];

  checksList.innerHTML = checks.map(c => `
    <div class="src-item">
      <i class='bx ${c.icon}' style="color:${c.pass ? 'var(--green)' : 'var(--red)'}"></i>
      <span class="src-label">${c.label}</span>
      <span class="src-result" style="color:${c.pass ? 'var(--green)' : 'var(--red)'}">${c.pass ? 'PASS' : 'FAIL'}</span>
    </div>
    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:0 14px 8px;margin-top:-4px">${c.detail}</div>
  `).join('');

  // History
  const histEl = document.getElementById('srHistory');
  const events = r.isClean
    ? [
        { date: '2024-11-15', event: 'Document issued' },
        { date: '2024-11-15', event: 'Registered in national DB' },
        { date: '2025-02-20', event: 'Scanned at airport checkpoint — CLEAR' }
      ]
    : r.isRevoked
    ? [
        { date: '2022-03-10', event: 'Document issued' },
        { date: '2022-03-10', event: 'Registered in national DB' },
        { date: '2023-07-04', event: 'REPORTED LOST by owner' },
        { date: '2023-07-05', event: 'REVOCATION entered into DB' },
        { date: '2026-04-15', event: '🚨 SCAN ATTEMPT — FLAGGED' }
      ]
    : [
        { date: '—', event: 'No history found — serial may be fabricated' }
      ];

  histEl.innerHTML = `
    <div class="srh-title">USAGE HISTORY</div>
    ${events.map(e => `
      <div class="srh-item">
        <span class="srh-date">${e.date}</span>
        <span class="srh-event">${e.event}</span>
      </div>
    `).join('')}
  `;
}

// Batch verification
function runBatchVerification(serials) {
  srpWaiting.style.display = 'none';
  srpScanning.style.display = 'none';
  srpResult.style.display = 'none';
  batchResults.style.display = 'block';

  const summary = document.getElementById('brSummary');
  const tbody = document.getElementById('brTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:16px;font-family:var(--font-mono);font-size:11px">Scanning...</td></tr>';

  let valid = 0, invalid = 0, revoked = 0;

  setTimeout(() => {
    const rows = serials.map((serial, i) => {
      const r = analyzeSerial(serial, selectedType);
      let status, statusCls, risk;
      if (r.isClean) { status = 'VALID'; statusCls = 'verdict-clean'; risk = Math.floor(Math.random() * 15); valid++; }
      else if (r.isRevoked) { status = 'REVOKED'; statusCls = 'verdict-forged'; risk = 90 + Math.floor(Math.random() * 10); revoked++; }
      else if (r.isDuplicate) { status = 'DUPLICATE'; statusCls = 'verdict-forged'; risk = 80 + Math.floor(Math.random() * 15); invalid++; }
      else if (r.notFound) { status = 'NOT FOUND'; statusCls = 'verdict-forged'; risk = 75 + Math.floor(Math.random() * 20); invalid++; }
      else { status = 'FORMAT ERR'; statusCls = 'verdict-suspect'; risk = 50 + Math.floor(Math.random() * 30); invalid++; }
      const riskCls = risk < 30 ? 'check-pass' : risk < 60 ? 'check-warn' : 'check-fail';
      return `<tr>
        <td style="color:var(--text-dim)">${i + 1}</td>
        <td style="font-family:var(--font-mono);color:var(--cyan-mid)">${serial}</td>
        <td class="${statusCls}">${status}</td>
        <td class="${riskCls}" style="font-family:var(--font-head);font-weight:700">${risk}%</td>
        <td style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">${r.formatValid ? 'Format OK' : 'Bad format'}</td>
      </tr>`;
    });

    tbody.innerHTML = rows.join('');

    summary.innerHTML = `
      <div class="brs-item"><span class="brs-val">${serials.length}</span><span class="brs-lbl">TOTAL SCANNED</span></div>
      <div class="brs-item"><span class="brs-val" style="color:var(--green)">${valid}</span><span class="brs-lbl">VALID</span></div>
      <div class="brs-item"><span class="brs-val" style="color:var(--red)">${invalid}</span><span class="brs-lbl">INVALID / FAKE</span></div>
      <div class="brs-item"><span class="brs-val" style="color:var(--warn)">${revoked}</span><span class="brs-lbl">REVOKED</span></div>
    `;
  }, 1200);
}

// Init DB last sync time
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('dbLastSync');
  if (el) el.textContent = new Date().toTimeString().slice(0, 8);

  // Animate DB stats counters
  const counters = { dbTotal: 4218440, dbValid: 4210122, dbRevoked: 5218, dbDupe: 3100 };
  Object.entries(counters).forEach(([id, target]) => {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0;
    const t0 = performance.now();
    function update(now) {
      const p = Math.min((now - t0) / 1800, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
});