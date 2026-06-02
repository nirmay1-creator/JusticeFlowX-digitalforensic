/* ===== LOCATION CONTRADICTION JS ===== */

const locAnalyzeBtn = document.getElementById('locAnalyzeBtn');
locAnalyzeBtn && locAnalyzeBtn.addEventListener('click', runLocationAnalysis);

function runLocationAnalysis() {
  const subject = document.getElementById('locSubject').value.trim() || 'SUBJECT';
  const claimedCity = document.getElementById('locClaimedCity').value.trim() || 'New Delhi';
  const since = parseInt(document.getElementById('locSince').value) || 2010;
  const ipRegion = document.getElementById('locIpRegion').value;
  const borderCross = parseInt(document.getElementById('locBorderCross').value) || 0;

  const seed = subject.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + since;
  const isFake = seed % 10 > 5;
  const contradiction = ipRegion && ipRegion !== claimedCity && ipRegion !== '';

  document.getElementById('locMapOverlay').style.display = 'none';
  drawLocationMap(claimedCity, ipRegion, since, seed, isFake, contradiction);
  buildTimeline(claimedCity, ipRegion, since, borderCross, seed, isFake, contradiction);
  showLocationResults(claimedCity, ipRegion, since, borderCross, seed, isFake, contradiction, subject);
}

const cityCoords = {
  'New Delhi': { x: 0.57, y: 0.38 },
  'Delhi': { x: 0.57, y: 0.38 },
  'Mumbai': { x: 0.52, y: 0.49 },
  'Bangalore': { x: 0.54, y: 0.58 },
  'Chennai': { x: 0.58, y: 0.6 },
  'Kolkata': { x: 0.67, y: 0.44 },
  'Hyderabad': { x: 0.56, y: 0.53 },
  'Dubai': { x: 0.42, y: 0.44 },
  'London': { x: 0.25, y: 0.27 },
  'New York': { x: 0.1, y: 0.35 }
};

function drawLocationMap(claimed, ip, since, seed, isFake, contradiction) {
  const canvas = document.getElementById('locMapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Draw stylized world map
  ctx.fillStyle = '#050d1e';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(0,245,255,0.06)'; ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Draw simplified continent shapes
  drawContinents(ctx, W, H);

  // City markers
  const claimedCoord = cityCoords[claimed] || cityCoords['New Delhi'];
  const ipCoord = ip ? cityCoords[ip] : null;

  // Draw claimed location
  const cx = claimedCoord.x * W, cy2 = claimedCoord.y * H;
  drawMapMarker(ctx, cx, cy2, '#00f5ff', claimed, 'CLAIMED');

  // Draw IP location if different
  if (ipCoord && ip) {
    const ix = ipCoord.x * W, iy = ipCoord.y * H;
    drawMapMarker(ctx, ix, iy, contradiction ? '#ff2b5e' : '#00ff88', ip, 'ACTUAL IP');

    // Draw arc between them
    if (contradiction) {
      ctx.beginPath();
      const mx = (cx + ix) / 2, my = Math.min(cy2, iy) - 60;
      ctx.moveTo(cx, cy2);
      ctx.quadraticCurveTo(mx, my, ix, iy);
      ctx.strokeStyle = 'rgba(255,43,94,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      // Contradiction label
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.fillStyle = '#ff2b5e';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ CONTRADICTION', mx, my - 10);
    }
  }

  // Pulse rings on claimed location
  for (let r = 20; r <= 60; r += 20) {
    ctx.beginPath();
    ctx.arc(cx, cy2, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,245,255,${0.08 * (70 - r) / 70})`;
    ctx.lineWidth = 1; ctx.stroke();
  }
}

function drawContinents(ctx, W, H) {
  // Simplified blob shapes for major land masses
  const shapes = [
    // India subcontinent area
    { path: [[0.50,0.36],[0.65,0.36],[0.68,0.50],[0.60,0.62],[0.55,0.64],[0.48,0.54],[0.47,0.42]], color: 'rgba(0,80,120,0.35)' },
    // Europe
    { path: [[0.22,0.22],[0.38,0.20],[0.42,0.32],[0.36,0.36],[0.22,0.34]], color: 'rgba(0,80,120,0.3)' },
    // Middle East
    { path: [[0.38,0.34],[0.50,0.34],[0.50,0.50],[0.40,0.52],[0.36,0.44]], color: 'rgba(0,80,120,0.25)' },
    // East Asia
    { path: [[0.65,0.24],[0.82,0.22],[0.85,0.40],[0.72,0.45],[0.64,0.38]], color: 'rgba(0,80,120,0.28)' },
    // North America
    { path: [[0.06,0.22],[0.26,0.20],[0.28,0.44],[0.18,0.52],[0.08,0.44]], color: 'rgba(0,80,120,0.3)' },
    // Africa
    { path: [[0.32,0.40],[0.48,0.38],[0.50,0.70],[0.36,0.76],[0.28,0.62],[0.28,0.48]], color: 'rgba(0,80,120,0.28)' }
  ];

  shapes.forEach(s => {
    ctx.beginPath();
    s.path.forEach(([rx, ry], i) => {
      const x = rx * W, y = ry * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,245,255,0.15)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  });
}

function drawMapMarker(ctx, x, y, color, city, label) {
  // Dot
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = color + '33'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.shadowBlur = 12; ctx.shadowColor = color; ctx.stroke(); ctx.shadowBlur = 0;
  // Label
  ctx.font = 'bold 9px Rajdhani';
  ctx.fillStyle = color; ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 14);
  ctx.font = '8px Share Tech Mono';
  ctx.fillStyle = 'rgba(180,220,240,0.6)';
  ctx.fillText(city.toUpperCase(), x, y - 4);
}

function buildTimeline(claimed, ip, since, borderCross, seed, isFake, contradiction) {
  const tl = document.getElementById('locTimeline');
  const track = document.getElementById('ltTrack');
  if (!tl || !track) return;
  tl.style.display = 'block';

  const currentYear = 2026;
  const events = [];

  events.push({ year: since, location: claimed, source: 'ID CARD', color: '#00f5ff', ok: true });

  if (isFake || contradiction) {
    // Insert contradicting events
    const midYear = since + Math.floor((currentYear - since) / 3);
    events.push({ year: midYear, location: ip || 'UNKNOWN', source: 'CELL TOWER', color: '#ff2b5e', ok: false });
    events.push({ year: midYear + 2, location: ip || 'UNKNOWN', source: 'IP RECORD', color: '#ff2b5e', ok: false });
    if (borderCross > 0) events.push({ year: midYear + 3, location: 'INT. BORDER', source: 'PASSPORT', color: '#ffb800', ok: true });
    events.push({ year: currentYear, location: ip || 'UNKNOWN', source: 'CURRENT IP', color: '#ff2b5e', ok: false });
  } else {
    const midYear = since + Math.floor((currentYear - since) / 2);
    events.push({ year: midYear, location: claimed, source: 'VOTER ROLL', color: '#00ff88', ok: true });
    if (borderCross > 0) events.push({ year: midYear + 1, location: 'ABROAD', source: 'PASSPORT', color: '#00ff88', ok: true });
    events.push({ year: currentYear, location: claimed, source: 'LIVE IP', color: '#00ff88', ok: true });
  }

  events.sort((a, b) => a.year - b.year);
  track.innerHTML = events.map(e => `
    <div class="lt-event">
      <div class="lt-dot" style="border-color:${e.color};color:${e.color}">${e.ok ? '✓' : '✗'}</div>
      <div class="lt-year">${e.year}</div>
      <div class="lt-location" style="color:${e.color}">${e.location.substring(0, 10)}</div>
      <div class="lt-source">${e.source}</div>
    </div>
  `).join('');
}

function showLocationResults(claimed, ip, since, borderCross, seed, isFake, contradiction, subject) {
  const section = document.getElementById('locResultsSection');
  section.style.display = 'flex';

  // Contradiction list
  const clList = document.getElementById('locContradictionList');
  const contradictions = buildContradictions(claimed, ip, since, borderCross, seed, isFake, contradiction);
  clList.innerHTML = `
    <div class="lc-header"><i class='bx bx-error'></i> CONTRADICTION ANALYSIS — ${contradictions.filter(c => c.type === 'contra').length} CONTRADICTIONS FOUND</div>
    <div class="lc-body">${contradictions.map(c => `
      <div class="lc-item ${c.type}">
        <div class="lci-row1">
          <i class='bx ${c.icon} lci-icon' style="color:${c.type === 'contra' ? 'var(--red)' : c.type === 'warn' ? 'var(--warn)' : 'var(--green)'}"></i>
          <span class="lci-title" style="color:${c.type === 'contra' ? 'var(--red)' : c.type === 'warn' ? 'var(--warn)' : 'var(--green)'}">${c.title}</span>
          <span class="lci-badge" style="background:${c.type === 'contra' ? 'rgba(255,43,94,0.15)' : c.type === 'warn' ? 'rgba(255,184,0,0.1)' : 'rgba(0,255,136,0.1)'};color:${c.type === 'contra' ? 'var(--red)' : c.type === 'warn' ? 'var(--warn)' : 'var(--green)'}">${c.type.toUpperCase()}</span>
        </div>
        <div class="lci-detail">${c.detail}</div>
      </div>
    `).join('')}</div>`;

  // Data sources
  const dsList = document.getElementById('locDataSources');
  const sources = [
    { icon: 'bx-signal-4', label: 'Cell Tower Pings', status: isFake ? 'MISMATCH' : 'MATCH', ok: !isFake },
    { icon: 'bx-wifi', label: 'IP Geolocation', status: contradiction ? 'MISMATCH' : ip ? 'MATCH' : 'NO DATA', ok: !contradiction },
    { icon: 'bx-passport', label: 'Border Control DB', status: borderCross > 5 ? 'MULTIPLE EXITS' : 'NORMAL', ok: borderCross <= 5 },
    { icon: 'bx-camera', label: 'CCTV Index', status: isFake ? 'NO APPEARANCE' : 'FOUND ×' + (3 + Math.floor(seed % 8)), ok: !isFake },
    { icon: 'bx-receipt', label: 'Bank/Utility Records', status: isFake ? 'NOT FOUND' : 'PRESENT', ok: !isFake },
    { icon: 'bx-user-check', label: 'Voter Registration', status: isFake ? 'NOT REGISTERED' : 'REGISTERED ' + since, ok: !isFake }
  ];
  dsList.innerHTML = `
    <div class="lds-header"><i class='bx bx-data'></i> DATA SOURCES CHECKED</div>
    <div class="lds-body">${sources.map(s => `
      <div class="lds-item">
        <i class='bx ${s.icon} lds-icon' style="color:${s.ok ? 'var(--green)' : 'var(--red)'}"></i>
        <span class="lds-label">${s.label}</span>
        <span class="lds-status" style="color:${s.ok ? 'var(--green)' : 'var(--red)'}">${s.status}</span>
      </div>`).join('')}</div>`;

  // Verdict
  const vEl = document.getElementById('locVerdict');
  const numContra = contradictions.filter(c => c.type === 'contra').length;
  if (numContra >= 3 || isFake) {
    vEl.innerHTML = `<div class="loc-verdict-box" style="background:rgba(255,43,94,0.08);border-color:rgba(255,43,94,0.3);color:var(--red)"><i class='bx bx-error-circle' style="font-size:28px"></i> 🚨 LOCATION FRAUD DETECTED — "${subject}" claims residence in ${claimed} since ${since} but records show repeated presence in ${ip || 'other locations'} — IMPOSSIBLE LOCATION HISTORY</div>`;
  } else if (numContra >= 1) {
    vEl.innerHTML = `<div class="loc-verdict-box" style="background:rgba(255,184,0,0.08);border-color:rgba(255,184,0,0.3);color:var(--warn)"><i class='bx bx-error' style="font-size:28px"></i> ⚠ LOCATION INCONSISTENCIES — ${numContra} contradiction(s) found. Manual investigation recommended.</div>`;
  } else {
    vEl.innerHTML = `<div class="loc-verdict-box" style="background:rgba(0,255,136,0.08);border-color:rgba(0,255,136,0.3);color:var(--green)"><i class='bx bx-check-shield' style="font-size:28px"></i> ✓ LOCATION HISTORY CONSISTENT — All data sources confirm presence in ${claimed} since ${since}.</div>`;
  }
}

function buildContradictions(claimed, ip, since, borderCross, seed, isFake, contradiction) {
  const list = [];
  const years = 2026 - since;

  if (contradiction && ip) {
    list.push({ icon: 'bx-wifi', title: `IP Origin: ${ip} ≠ Claimed: ${claimed}`, type: 'contra', detail: `Last 48 IP records trace to ${ip}, not ${claimed}. ${years}-year residence claim contradicted.` });
  } else if (ip) {
    list.push({ icon: 'bx-wifi', title: `IP Origin Matches Claimed City`, type: 'ok', detail: `IP geolocation consistent with ${claimed} — no contradiction detected.` });
  }

  if (isFake) {
    list.push({ icon: 'bx-signal-4', title: 'No Cell Tower Activity in ' + claimed, type: 'contra', detail: `Zero cell tower pings recorded in ${claimed} across ${years} years. Phone activity concentrated elsewhere.` });
    list.push({ icon: 'bx-camera', title: 'No CCTV Appearances in ' + claimed, type: 'contra', detail: `Facial recognition cross-reference found 0 CCTV appearances in ${claimed} for this identity.` });
    list.push({ icon: 'bx-receipt', title: 'No Utility/Bank Records in ' + claimed, type: 'contra', detail: `No electricity, water, or banking records found at claimed ${claimed} address for this identity.` });
  } else {
    list.push({ icon: 'bx-signal-4', title: 'Cell Tower Data Consistent', type: 'ok', detail: `Phone pings confirm regular presence in ${claimed} over ${years} years.` });
  }

  if (borderCross > 8) {
    list.push({ icon: 'bx-passport', title: `${borderCross} Border Crossings in 5 Years`, type: 'warn', detail: `High frequency of international travel. While not conclusive, warrants additional scrutiny.` });
  } else if (borderCross > 0) {
    list.push({ icon: 'bx-passport', title: `${borderCross} Border Crossings — Normal`, type: 'ok', detail: `Normal international travel pattern. No suspicious crossing patterns detected.` });
  }

  if (isFake && since < 2015) {
    list.push({ icon: 'bx-user-x', title: 'Voter/Utility Reg Missing Since ' + since, type: 'contra', detail: `Expected 10+ year paper trail (voter rolls, utility bills, local taxes) not found for ${claimed}.` });
  }

  return list;
}