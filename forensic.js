/* ===========================
   FORENSIC SHARED JS
   =========================== */

// Animate stat counters
function animateForensicStats() {
  const targets = {
    scansToday: 47,
    forgeries: 12,
    verified: 35
  };
  Object.entries(targets).forEach(([id, target]) => {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0;
    const dur = 1600;
    const t0 = performance.now();
    function update(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

// Animate module bar fills
function animateModuleBars() {
  document.querySelectorAll('.fmod-bar-fill').forEach(bar => {
    const w = bar.getAttribute('data-width');
    if (w) setTimeout(() => bar.style.width = w + '%', 600);
  });
}

// Live feed row generator
const feedDocTypes = ['Passport', 'National ID', "Driver's License", 'Visa', 'Birth Cert'];
const feedVerdicts = [
  { label: 'CLEAN', cls: 'verdict-clean' },
  { label: 'CLEAN', cls: 'verdict-clean' },
  { label: 'CLEAN', cls: 'verdict-clean' },
  { label: 'FORGED', cls: 'verdict-forged' },
  { label: 'SUSPECTED', cls: 'verdict-suspect' }
];
const checkStates = ['✓', '✓', '✗', '⚠'];

function randomCheck(leaning) {
  if (leaning === 'clean') return Math.random() > 0.15 ? '<span class="check-pass">PASS</span>' : '<span class="check-warn">WARN</span>';
  if (leaning === 'forged') return Math.random() > 0.5 ? '<span class="check-fail">FAIL</span>' : '<span class="check-warn">WARN</span>';
  return Math.random() > 0.6 ? '<span class="check-pass">PASS</span>' : '<span class="check-warn">WARN</span>';
}

function randomSerial() {
  const countries = ['IND', 'USA', 'GBR', 'DEU', 'FRA'];
  const c = countries[Math.floor(Math.random() * countries.length)];
  const y = 2020 + Math.floor(Math.random() * 6);
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 6; i++) s += Math.random() > 0.5 ? alpha[Math.floor(Math.random() * alpha.length)] : Math.floor(Math.random() * 10);
  return `${c}-${y}-${s}`;
}

function generateFeedRow() {
  const v = feedVerdicts[Math.floor(Math.random() * feedVerdicts.length)];
  const doc = feedDocTypes[Math.floor(Math.random() * feedDocTypes.length)];
  const leaning = v.cls === 'verdict-clean' ? 'clean' : v.cls === 'verdict-forged' ? 'forged' : 'suspect';
  const risk = leaning === 'clean' ? Math.floor(Math.random() * 20) : leaning === 'forged' ? 70 + Math.floor(Math.random() * 30) : 35 + Math.floor(Math.random() * 35);
  const riskCls = risk < 30 ? 'check-pass' : risk < 60 ? 'check-warn' : 'check-fail';
  const now = new Date();
  const ts = now.toTimeString().slice(0, 8);

  return `<tr>
    <td style="color:var(--text-dim)">${ts}</td>
    <td>${doc}</td>
    <td style="font-family:var(--font-mono);font-size:9px;color:var(--cyan-mid)">${randomSerial()}</td>
    <td>${randomCheck(leaning)}</td>
    <td>${randomCheck(leaning)}</td>
    <td class="${v.cls}">${v.label}</td>
    <td class="${riskCls}" style="font-family:var(--font-head);font-weight:700">${risk}%</td>
  </tr>`;
}

function startLiveFeed() {
  const tbody = document.getElementById('liveFeedBody');
  if (!tbody) return;
  // Seed initial rows
  for (let i = 0; i < 8; i++) {
    tbody.innerHTML += generateFeedRow();
  }
  setInterval(() => {
    tbody.innerHTML = generateFeedRow() + tbody.innerHTML;
    while (tbody.children.length > 20) tbody.removeChild(tbody.lastChild);
  }, 2800);
}

// Threat ring animation
function animateThreatRing() {
  const circle = document.getElementById('threatCircle');
  if (!circle) return;
  const circumference = 314;
  let offset = circumference;
  const target = circumference * 0.3; // 70% filled
  const t0 = performance.now();
  const dur = 2000;
  function update(now) {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    circle.style.strokeDashoffset = offset - (offset - target) * eased;
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

document.addEventListener('DOMContentLoaded', () => {
  animateForensicStats();
  animateModuleBars();
  startLiveFeed();
  animateThreatRing();
  // Update DB last sync time
  const syncEl = document.getElementById('dbLastSync');
  if (syncEl) {
    const d = new Date();
    syncEl.textContent = d.toTimeString().slice(0, 8);
  }
});