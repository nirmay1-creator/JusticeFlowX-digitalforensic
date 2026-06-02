/* ===== NETWORK HUB JS ===== */

// Animated orb (network sphere)
function initOrb() {
  const canvas = document.getElementById('orbCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 200, H = 200, cx = 100, cy = 100;
  const nodes = [];
  for (let i = 0; i < 22; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 30 + Math.random() * 60;
    nodes.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: 1.5 + Math.random() * 2.5,
      color: ['#00f5ff', '#7b2fff', '#00ff88', '#ffb800'][Math.floor(Math.random() * 4)],
      alpha: 0.4 + Math.random() * 0.6
    });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Central node
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,245,255,0.9)';
    ctx.shadowBlur = 16; ctx.shadowColor = '#00f5ff';
    ctx.fill();
    ctx.shadowBlur = 0;
    // Connections
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y);
      ctx.strokeStyle = `rgba(0,245,255,${n.alpha * 0.2})`;
      ctx.lineWidth = 0.7; ctx.stroke();
    });
    // Cross connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 55) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(123,47,255,${0.15 * (1 - d / 55)})`;
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
    }
    // Nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.shadowBlur = 6; ctx.shadowColor = n.color;
      ctx.globalAlpha = n.alpha;
      ctx.fill();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      // Move
      n.x += n.vx; n.y += n.vy;
      const dx = n.x - cx, dy = n.y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 80 || d < 25) { n.vx *= -1; n.vy *= -1; }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// Stat counters
function initHubStats() {
  const targets = { nosSubjects: 284, nosFlagged: 38, nosCleared: 246 };
  Object.entries(targets).forEach(([id, target]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const t0 = performance.now();
    function upd(now) {
      const p = Math.min((now - t0) / 1800, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(upd);
    }
    requestAnimationFrame(upd);
  });
}

// Net live feed
const netSubjectIds = ['SUB-', 'NKL-', 'FKE-', 'VFD-', 'TMP-'];
function rId() {
  const p = netSubjectIds[Math.floor(Math.random() * netSubjectIds.length)];
  return p + Math.floor(1000 + Math.random() * 9000);
}
function rScore(leaning) {
  if (leaning === 'ok') return Math.floor(5 + Math.random() * 20);
  if (leaning === 'bad') return Math.floor(65 + Math.random() * 35);
  return Math.floor(30 + Math.random() * 40);
}
function rCell(score) {
  const cls = score < 30 ? 'check-pass' : score < 60 ? 'check-warn' : 'check-fail';
  return `<span class="${cls}" style="font-family:var(--font-head);font-weight:700">${score}%</span>`;
}

function netFeedRow() {
  const leanings = ['ok', 'ok', 'ok', 'bad', 'bad', 'suspect'];
  const l = leanings[Math.floor(Math.random() * leanings.length)];
  const social = rScore(l); const loc = rScore(l); const wear = rScore(l);
  const combined = Math.round((social + loc + wear) / 3);
  const cCls = combined < 30 ? 'verdict-clean' : combined < 60 ? 'verdict-suspect' : 'verdict-forged';
  const cLabel = combined < 30 ? 'CLEARED' : combined < 60 ? 'SUSPECTED' : 'FLAGGED';
  const action = combined > 60 ? '<span style="color:var(--red);font-weight:700">DETAIN</span>' : combined > 30 ? '<span style="color:var(--warn)">REVIEW</span>' : '<span style="color:var(--green)">PASS</span>';
  const ts = new Date().toTimeString().slice(0, 8);
  return `<tr>
    <td style="color:var(--text-dim)">${ts}</td>
    <td style="font-family:var(--font-mono);color:var(--cyan-mid)">${rId()}</td>
    <td>${rCell(social)}</td>
    <td>${rCell(loc)}</td>
    <td>${rCell(wear)}</td>
    <td class="${cCls}">${cLabel}</td>
    <td>${action}</td>
  </tr>`;
}

function initNetFeed() {
  const tbody = document.getElementById('netFeedBody');
  if (!tbody) return;
  for (let i = 0; i < 8; i++) tbody.innerHTML += netFeedRow();
  setInterval(() => {
    tbody.innerHTML = netFeedRow() + tbody.innerHTML;
    while (tbody.children.length > 20) tbody.removeChild(tbody.lastChild);
  }, 2600);
}

document.addEventListener('DOMContentLoaded', () => {
  initOrb();
  initHubStats();
  initNetFeed();
});