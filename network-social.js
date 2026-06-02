/* ===== SOCIAL GRAPH JS ===== */

const sgAnalyzeBtn = document.getElementById('sgAnalyzeBtn');
const sgGraphOverlay = document.getElementById('sgGraphOverlay');
const sgResultsSection = document.getElementById('sgResultsSection');
const socialCanvas = document.getElementById('socialGraph');
const ctx = socialCanvas ? socialCanvas.getContext('2d') : null;

// Seeded pseudo-random
function seededRand(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff; }; }

sgAnalyzeBtn && sgAnalyzeBtn.addEventListener('click', runSocialAnalysis);

function runSocialAnalysis() {
  const name = document.getElementById('sgName').value.trim() || 'SUBJECT';
  const city = document.getElementById('sgCity').value.trim() || 'Unknown';
  const employer = document.getElementById('sgEmployer').value.trim() || '';
  const years = parseInt(document.getElementById('sgYears').value) || 0;
  const dob = document.getElementById('sgDob').value;

  const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + years;
  const rand = seededRand(seed);

  const isFake = seed % 10 > 6; // deterministic based on input

  // Build graph data
  const connections = buildConnections(name, city, employer, years, rand, isFake);
  const isolationScore = calcIsolationScore(connections, years, isFake);

  sgGraphOverlay.style.display = 'none';
  drawSocialGraph(name, connections, rand, isFake);
  showSocialResults(connections, isolationScore, isFake, name, city);
}

function buildConnections(name, city, employer, years, rand, isFake) {
  if (isFake) {
    // Fake identity: sparse or no connections
    const conns = [];
    if (rand() > 0.5) conns.push({ type: 'family', label: 'Parent Record', verified: false, db: 'Birth Registry', status: 'NOT FOUND', icon: 'bx-user' });
    if (rand() > 0.7) conns.push({ type: 'employer', label: employer || 'Claimed Employer', verified: false, db: 'Tax/Employment DB', status: 'NO RECORD', icon: 'bx-building' });
    if (rand() > 0.8) conns.push({ type: 'neighbor', label: 'Nearest Neighbor', verified: false, db: 'Address Registry', status: 'UNLINKED', icon: 'bx-home' });
    return conns;
  }

  const conns = [];
  const firstNames = ['Priya', 'Amit', 'Sunita', 'Rahul', 'Ananya', 'Vikram', 'Meena', 'Suresh', 'Kavita'];
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  // Family
  const numFamily = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < numFamily; i++) {
    const relations = ['Spouse', 'Parent', 'Sibling', 'Child'];
    conns.push({ type: 'family', label: pick(firstNames) + ' ' + name.split(' ').pop(), verified: rand() > 0.2, db: 'Civil Registry', status: rand() > 0.2 ? 'VERIFIED' : 'PARTIAL', icon: 'bx-user', relation: relations[i % relations.length] });
  }
  // Employer
  if (rand() > 0.2) {
    conns.push({ type: 'employer', label: 'Employer: ' + (document.getElementById('sgEmployer').value || 'XYZ Corp'), verified: rand() > 0.15, db: 'Tax/PF Database', status: rand() > 0.15 ? 'CONFIRMED' : 'PENDING', icon: 'bx-building', relation: 'Employer' });
  }
  // Neighbors
  const numNeighbors = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < numNeighbors; i++) {
    conns.push({ type: 'neighbor', label: pick(firstNames) + ' (Neighbor)', verified: rand() > 0.3, db: 'Voter/Utility Roll', status: rand() > 0.3 ? 'CONFIRMED' : 'UNVERIFIED', icon: 'bx-home', relation: 'Neighbor' });
  }
  // Social media
  if (rand() > 0.3) {
    conns.push({ type: 'social', label: 'Social Media Profile', verified: rand() > 0.2, db: 'Social Archive', status: rand() > 0.2 ? 'ACTIVE SINCE ' + (2010 + Math.floor(rand() * 10)) : 'NO PROFILE', icon: 'bx-globe', relation: 'Online' });
  }
  // References
  if (rand() > 0.4) {
    conns.push({ type: 'reference', label: pick(firstNames) + ' (Professional Ref)', verified: rand() > 0.3, db: 'Govt ID Lookup', status: rand() > 0.3 ? 'VERIFIED' : 'PARTIAL', icon: 'bx-briefcase', relation: 'Reference' });
  }
  return conns;
}

function calcIsolationScore(connections, years, isFake) {
  if (isFake) return 75 + Math.floor(Math.random() * 20);
  const verified = connections.filter(c => c.verified).length;
  const total = connections.length;
  const coverage = total === 0 ? 0 : verified / total;
  return Math.max(5, Math.round((1 - coverage) * 60 + (years < 3 ? 20 : 0)));
}

function drawSocialGraph(subjectName, connections, rand, isFake) {
  if (!ctx) return;
  const W = socialCanvas.width, H = socialCanvas.height;
  const cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);

  // Background grid
  ctx.strokeStyle = 'rgba(0,245,255,0.04)'; ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const nodePositions = [];

  if (isFake || connections.length === 0) {
    // Draw isolated subject node
    drawNode(ctx, cx, cy, 22, '#00f5ff', subjectName.split(' ')[0], true);
    // Show isolation ripples
    for (let r = 50; r <= 180; r += 50) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,43,94,${0.08 * (200 - r) / 200})`;
      ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.font = '11px Share Tech Mono';
    ctx.fillStyle = 'rgba(255,43,94,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('NO VERIFIED CONNECTIONS', cx, cy + 100);
    ctx.fillStyle = 'rgba(255,43,94,0.35)';
    ctx.fillText('ISOLATION DETECTED', cx, cy + 116);
    return;
  }

  const angleStep = (Math.PI * 2) / connections.length;
  connections.forEach((conn, i) => {
    const baseAngle = angleStep * i - Math.PI / 2;
    const distVariance = 100 + rand() * 60;
    const nx = cx + Math.cos(baseAngle) * distVariance;
    const ny = cy + Math.sin(baseAngle) * distVariance;
    nodePositions.push({ x: nx, y: ny, conn });

    // Connection line
    const lineColor = conn.verified ? 'rgba(0,255,136,0.5)' : 'rgba(255,184,0,0.35)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny);
    if (!conn.verified) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,184,0,0.3)';
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = lineColor;
    }
    ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);

    // Node
    const nodeColor = conn.verified ? '#00ff88' : conn.status === 'NO RECORD' || conn.status === 'NOT FOUND' ? '#ff2b5e' : '#ffb800';
    drawNode(ctx, nx, ny, 14, nodeColor, conn.label.split(' ')[0]);

    // Label
    ctx.font = '9px Share Tech Mono';
    ctx.fillStyle = 'rgba(180,220,240,0.6)';
    ctx.textAlign = nx < cx ? 'right' : 'left';
    const labelX = nx + (nx < cx ? -20 : 20);
    ctx.fillText(conn.status, labelX, ny + 4);
  });

  // Subject node (on top)
  drawNode(ctx, cx, cy, 22, '#00f5ff', subjectName.split(' ')[0], true);
}

function drawNode(ctx, x, y, r, color, label, isSubject = false) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color + '22';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = isSubject ? 2.5 : 1.5;
  ctx.shadowBlur = isSubject ? 20 : 10;
  ctx.shadowColor = color;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (isSubject) {
    // Inner pulse ring
    ctx.beginPath();
    ctx.arc(x, y, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = color + '44';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.font = isSubject ? 'bold 10px Rajdhani' : '8px Share Tech Mono';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(label.substring(0, 8), x, y + 3);
}

function showSocialResults(connections, isolationScore, isFake, name, city) {
  sgResultsSection.style.display = 'flex';

  // Isolation ring
  drawIsolationRing(isolationScore, isFake);

  // Breakdown
  const breakdown = document.getElementById('sgiBreakdown');
  const categories = [
    { icon: 'bx-user', label: 'Family', key: 'family' },
    { icon: 'bx-building', label: 'Employer', key: 'employer' },
    { icon: 'bx-home', label: 'Neighbors', key: 'neighbor' },
    { icon: 'bx-globe', label: 'Social', key: 'social' }
  ];
  breakdown.innerHTML = categories.map(cat => {
    const count = connections.filter(c => c.type === cat.key && c.verified).length;
    const color = count === 0 ? 'var(--red)' : count > 1 ? 'var(--green)' : 'var(--warn)';
    return `<div class="sgib-item">
      <i class='bx ${cat.icon} sgib-icon' style="color:${color}"></i>
      <span class="sgib-label">${cat.label} Links</span>
      <span class="sgib-count" style="color:${color}">${count}</span>
    </div>`;
  }).join('');

  // Connection audit
  const body = document.getElementById('sgConnectionsBody');
  if (connections.length === 0) {
    body.innerHTML = `<div style="text-align:center;padding:30px;font-family:var(--font-mono);font-size:11px;color:var(--red)">⚠ ZERO VERIFIED CONNECTIONS FOUND<br><span style="color:var(--text-dim);font-size:9px">This identity has no traceable social footprint</span></div>`;
  } else {
    body.innerHTML = connections.map(c => {
      const statusColor = c.verified ? 'var(--green)' : c.status.includes('NOT FOUND') || c.status.includes('NO RECORD') ? 'var(--red)' : 'var(--warn)';
      return `<div class="sgc-item">
        <div class="sgc-avatar" style="border-color:${statusColor}">
          <i class='bx ${c.icon}' style="color:${statusColor}"></i>
        </div>
        <div class="sgc-info">
          <div class="sgc-name">${c.label}</div>
          <div class="sgc-relation">${c.relation || c.type.toUpperCase()}</div>
        </div>
        <div style="text-align:right">
          <div class="sgc-status" style="color:${statusColor}">${c.status}</div>
          <div class="sgc-db">${c.db}</div>
        </div>
      </div>`;
    }).join('');
  }

  // Verdict
  const verdict = document.getElementById('sgVerdictPanel');
  if (isFake || isolationScore > 70) {
    verdict.className = 'sg-verdict-panel rv-forged';
    verdict.style.cssText = 'background:rgba(255,43,94,0.08);border-color:rgba(255,43,94,0.3);color:var(--red)';
    verdict.innerHTML = `<i class='bx bx-error-circle' style="font-size:28px"></i> 🚨 IDENTITY ISOLATION DETECTED — "${name}" HAS 0 VERIFIED SOCIAL CONNECTIONS — FAKE IDENTITY SUSPECTED`;
  } else if (isolationScore > 45) {
    verdict.style.cssText = 'background:rgba(255,184,0,0.08);border-color:rgba(255,184,0,0.3);color:var(--warn)';
    verdict.innerHTML = `<i class='bx bx-error' style="font-size:28px"></i> ⚠ SPARSE SOCIAL NETWORK — Manual review recommended. ${connections.filter(c => c.verified).length} of ${connections.length} connections verified.`;
  } else {
    verdict.style.cssText = 'background:rgba(0,255,136,0.08);border-color:rgba(0,255,136,0.3);color:var(--green)';
    verdict.innerHTML = `<i class='bx bx-check-shield' style="font-size:28px"></i> ✓ SOCIAL GRAPH NORMAL — ${connections.filter(c => c.verified).length} verified connections found in ${city}. Identity appears socially established.`;
  }
}

function drawIsolationRing(score, isFake) {
  const canvas = document.getElementById('isolationRing');
  if (!canvas) return;
  const ctx2 = canvas.getContext('2d');
  const cx = 80, cy = 80, r = 60;
  ctx2.clearRect(0, 0, 160, 160);

  // Track
  ctx2.beginPath(); ctx2.arc(cx, cy, r, 0, Math.PI * 2);
  ctx2.strokeStyle = 'rgba(0,245,255,0.1)'; ctx2.lineWidth = 8; ctx2.stroke();

  // Fill
  const color = score > 70 ? '#ff2b5e' : score > 45 ? '#ffb800' : '#00ff88';
  const pct = score / 100;
  ctx2.beginPath();
  ctx2.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx2.strokeStyle = color; ctx2.lineWidth = 8; ctx2.lineCap = 'round';
  ctx2.shadowBlur = 12; ctx2.shadowColor = color;
  ctx2.stroke(); ctx2.shadowBlur = 0;

  // Score text
  const scoreEl = document.getElementById('sgIsolationScore');
  if (scoreEl) { scoreEl.textContent = score + '%'; scoreEl.style.color = color; }
}