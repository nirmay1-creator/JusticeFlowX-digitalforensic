console.log("[JusticeFlowX] System Initializing...");

const SYSTEM_PASSWORD = "justice123";

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/* ========================= CLOCK ========================= */
function startClock() {
  const el = document.getElementById("clockDisplay");
  if (!el) return;
  function tick() { el.textContent = new Date().toTimeString().slice(0, 8); }
  tick(); setInterval(tick, 1000);
}

/* ========================= CPU METER ========================= */
function startCpuMeter() {
  const el = document.getElementById("cpuVal");
  if (!el) return;
  let base = 30;
  setInterval(() => {
    base = Math.max(10, Math.min(85, base + (Math.random() - 0.5) * 14));
    el.textContent = Math.round(base) + "%";
    el.style.color = base > 70 ? "var(--red)" : base > 50 ? "var(--warn)" : "var(--green)";
  }, 1800);
}

/* ========================= MARQUEE ========================= */
function startMarquee() {
  const el = document.getElementById("marqueeText");
  if (!el) return;
  el.textContent = "⬢ JUSTICEFX BIOMETRIC AUTHENTICATION LAYER 2 ACTIVE  ◆  DATABASE NODES 14/14 CONNECTED  ◆  LAST BREACH ATTEMPT: 72H AGO — NEUTRALIZED  ◆  NEXT AUDIT: 06:00 UTC  ◆  ALL SUBSYSTEMS NOMINAL";
}

/* ========================= HEX CANVAS ========================= */
function initHexCanvas() {
  const canvas = document.getElementById("hexCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener("resize", resize);
  const hexSize = 36;
  const cols = Math.ceil(window.innerWidth / (hexSize * 1.75)) + 2;
  const rows = Math.ceil(window.innerHeight / (hexSize * 1.55)) + 2;
  const hexagons = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      hexagons.push({
        x: c * hexSize * 1.75 + (r % 2 === 0 ? 0 : hexSize * 0.875),
        y: r * hexSize * 1.55,
        alpha: Math.random() * 0.15,
        pulseSpeed: randomBetween(0.002, 0.006),
        pulsePhase: Math.random() * Math.PI * 2,
        activated: false, activationTimer: 0,
      });
    }
  }
  setInterval(() => {
    const h = hexagons[Math.floor(Math.random() * hexagons.length)];
    if (!h.activated) { h.activated = true; h.activationTimer = 60; }
  }, 180);
  function drawHex(x, y, size, alpha, bright) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + size * Math.cos(angle), py = y + size * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = bright ? `rgba(0,245,255,${alpha * 3})` : `rgba(0,180,200,${alpha})`;
    ctx.lineWidth = bright ? 1.2 : 0.6;
    ctx.stroke();
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexagons.forEach(h => {
      h.pulsePhase += h.pulseSpeed;
      const pulse = 0.04 + Math.sin(h.pulsePhase) * 0.035;
      if (h.activated) { h.activationTimer--; if (h.activationTimer <= 0) h.activated = false; drawHex(h.x, h.y, hexSize - 2, pulse * 4, true); }
      else { drawHex(h.x, h.y, hexSize - 2, pulse, false); }
    });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ========================= DATA STREAMS ========================= */
function initDataStreams() {
  const container = document.getElementById("dataStreams");
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const stream = document.createElement("div");
    stream.className = "data-stream";
    stream.style.left = Math.random() * 100 + "vw";
    stream.style.animationDuration = randomBetween(6, 18) + "s";
    stream.style.animationDelay = randomBetween(0, 12) + "s";
    stream.style.height = randomBetween(80, 220) + "px";
    stream.style.opacity = randomBetween(0.1, 0.5);
    container.appendChild(stream);
  }
}

/* ========================= PARTICLES ========================= */
function initParticles() {
  const colors = ["#00f5ff", "#7b2fff", "#00ff88", "#ffffff"];
  for (let i = 0; i < 45; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = randomBetween(1.5, 4);
    p.style.width = size + "px"; p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "vw";
    p.style.bottom = "-10px";
    p.style.animationDuration = randomBetween(12, 28) + "s";
    p.style.animationDelay = randomBetween(0, 20) + "s";
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.background = color; p.style.boxShadow = `0 0 6px ${color}`;
    document.body.appendChild(p);
  }
}

/* ========================= ACCESS POPUP ========================= */
function showAccessPopup(granted, callback) {
  const popup = document.createElement("div");
  popup.className = "access-popup" + (granted ? " granted" : " denied");
  popup.innerHTML = `
    <span class="popup-icon">${granted ? "✓" : "✕"}</span>
    ${granted ? "ACCESS GRANTED" : "ACCESS DENIED"}
    <span class="popup-sub">${granted ? "IDENTITY VERIFIED — PROCEEDING" : "AUTHENTICATION FAILED"}</span>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add("show"), 50);
  setTimeout(() => popup.classList.remove("show"), 2800);
  setTimeout(() => { popup.remove(); if (granted && callback) callback(); }, 3200);
}

/* ========================= PASSWORD CHECK ========================= */
function requestPassword(onSuccess) {
  const password = prompt("🔐 Enter Security Password:");
  if (password === SYSTEM_PASSWORD) { showAccessPopup(true, onSuccess); }
  else { showAccessPopup(false); }
}

/* =====================================================================
   SCAN OVERLAYS — UNIQUE PER TYPE
   ===================================================================== */

/* ----------- TYPE 1: FINGERPRINT — Ridge Wave Scanner ----------- */
function showFingerprintOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "scan-overlay-full";
  overlay.innerHTML = `
    <div class="scan-animation-wrap">
      <div class="scan-title-overlay" style="color:var(--cyan)">FINGERPRINT ANALYSIS</div>
      <div style="position:relative;width:200px;height:200px;margin:10px 0">
        <canvas id="fpCanvas" width="200" height="200" style="position:absolute;inset:0;border-radius:50%;border:1px solid rgba(0,245,255,0.3)"></canvas>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2">
          <i class='bx bx-fingerprint' style="font-size:72px;color:var(--cyan);filter:drop-shadow(0 0 18px var(--cyan));opacity:0.85"></i>
        </div>
        <div id="fpSweep" style="position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);box-shadow:0 0 14px var(--cyan);z-index:3;top:0"></div>
      </div>
      <div class="scan-progress-label" id="scanLabel" style="color:var(--cyan)">Reading Ridge Patterns...</div>
      <div style="display:flex;gap:6px;margin:6px 0" id="ridgeNodes"></div>
      <div class="scan-bar-wrap"><div class="scan-bar-fill" id="scanBarFill" style="background:linear-gradient(90deg,var(--cyan),#00aaff)"></div></div>
    </div>
  `;
  document.body.appendChild(overlay);

  /* Ridge node dots */
  const nodes = overlay.querySelector("#ridgeNodes");
  for (let i = 0; i < 12; i++) {
    const d = document.createElement("div");
    d.style.cssText = "width:8px;height:8px;border-radius:50%;background:rgba(0,245,255,0.2);border:1px solid rgba(0,245,255,0.4);transition:background 0.3s,box-shadow 0.3s";
    nodes.appendChild(d);
  }

  /* Ridge wave canvas */
  const fpCanvas = overlay.querySelector("#fpCanvas");
  const ctx = fpCanvas.getContext("2d");
  let waveOffset = 0;
  function drawRidges() {
    ctx.clearRect(0, 0, 200, 200);
    ctx.save(); ctx.beginPath(); ctx.arc(100,100,99,0,Math.PI*2); ctx.clip();
    for (let r = 0; r < 8; r++) {
      const radius = 18 + r * 12;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        const noise = Math.sin(a * 7 + waveOffset + r * 0.8) * 2.5;
        const x = 100 + (radius + noise) * Math.cos(a);
        const y = 100 + (radius + noise) * Math.sin(a);
        a < 0.06 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(0,245,255,${0.08 + r * 0.04})`;
      ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
    waveOffset += 0.04;
  }
  const ridgeInterval = setInterval(drawRidges, 40);

  /* Sweep */
  const sweep = overlay.querySelector("#fpSweep");
  let sweepY = 0;
  const sweepInterval = setInterval(() => {
    sweepY = (sweepY + 2) % 200;
    sweep.style.top = sweepY + "px";
  }, 20);

  /* Light up nodes progressively */
  const dotEls = nodes.querySelectorAll("div");
  const fill = overlay.querySelector("#scanBarFill");
  const lbl = overlay.querySelector("#scanLabel");
  const steps = ["Reading Ridge Patterns...", "Cross-referencing Database...", "Verifying Identity..."];
  const total = 2800;
  const start = performance.now();
  let litNodes = 0;
  const nodeInterval = setInterval(() => {
    if (litNodes < dotEls.length) {
      dotEls[litNodes].style.background = "var(--cyan)";
      dotEls[litNodes].style.boxShadow = "0 0 8px var(--cyan)";
      litNodes++;
    }
  }, total / dotEls.length);

  function updateProgress(now) {
    const elapsed = now - start;
    const pct = Math.min((elapsed / total) * 100, 100);
    fill.style.width = pct + "%";
    lbl.textContent = steps[pct < 33 ? 0 : pct < 66 ? 1 : 2];
    if (elapsed < total) { requestAnimationFrame(updateProgress); }
    else {
      clearInterval(ridgeInterval); clearInterval(sweepInterval); clearInterval(nodeInterval);
      overlay.remove(); onComplete();
    }
  }
  requestAnimationFrame(updateProgress);
}

/* ----------- TYPE 2: FACIAL — Mesh Landmark Grid ----------- */
function showFacialOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "scan-overlay-full";
  overlay.innerHTML = `
    <div class="scan-animation-wrap">
      <div class="scan-title-overlay" style="color:#b18fff">FACIAL GEOMETRY SCAN</div>
      <div style="position:relative;width:200px;height:220px;margin:8px 0">
        <canvas id="faceCanvas" width="200" height="220" style="position:absolute;inset:0"></canvas>
      </div>
      <div class="scan-progress-label" id="scanLabel" style="color:#b18fff">Mapping Facial Geometry...</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;width:200px;justify-content:center;margin:4px 0" id="landmarkGrid"></div>
      <div class="scan-bar-wrap"><div class="scan-bar-fill" id="scanBarFill" style="background:linear-gradient(90deg,#7b2fff,#b18fff)"></div></div>
    </div>
  `;
  document.body.appendChild(overlay);

  /* Landmark dots */
  const grid = overlay.querySelector("#landmarkGrid");
  const dotCount = 32;
  for (let i = 0; i < dotCount; i++) {
    const d = document.createElement("div");
    d.style.cssText = "width:5px;height:5px;border-radius:50%;background:rgba(123,47,255,0.2);transition:background 0.2s,transform 0.2s";
    grid.appendChild(d);
  }

  /* Face mesh canvas */
  const fc = overlay.querySelector("#faceCanvas");
  const ctx = fc.getContext("2d");

  /* Simplified face landmark positions */
  const landmarks = [
    [70,60],[100,55],[130,60],            // brow
    [65,80],[100,75],[135,80],            // eyes top
    [68,95],[100,90],[132,95],            // eyes bot
    [85,110],[100,108],[115,110],         // nose
    [75,130],[100,125],[125,130],         // cheeks
    [80,150],[100,145],[120,150],         // upper lip
    [75,165],[100,162],[125,165],         // lower lip
    [60,130],[55,110],[60,90],[65,70],    // left jaw
    [140,130],[145,110],[140,90],[135,70],// right jaw
    [100,185],[85,182],[115,182],         // chin
  ];

  let revealCount = 0;
  let frameCount = 0;

  function drawFaceMesh() {
    ctx.clearRect(0, 0, 200, 220);
    frameCount++;
    /* Animated horizontal scan bar */
    const scanY = (frameCount * 1.5) % 220;
    const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, "rgba(123,47,255,0.25)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 20, 200, 40);

    /* Draw connections between nearby landmarks */
    ctx.strokeStyle = "rgba(123,47,255,0.25)";
    ctx.lineWidth = 0.6;
    for (let i = 0; i < revealCount; i++) {
      for (let j = i + 1; j < revealCount; j++) {
        const dx = landmarks[i][0] - landmarks[j][0];
        const dy = landmarks[i][1] - landmarks[j][1];
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 45) {
          ctx.beginPath();
          ctx.moveTo(landmarks[i][0], landmarks[i][1]);
          ctx.lineTo(landmarks[j][0], landmarks[j][1]);
          ctx.stroke();
        }
      }
    }
    /* Draw dots */
    for (let i = 0; i < revealCount; i++) {
      const pulse = 0.6 + 0.4 * Math.sin(frameCount * 0.08 + i);
      ctx.beginPath();
      ctx.arc(landmarks[i][0], landmarks[i][1], 3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(177,143,255,${pulse})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(landmarks[i][0], landmarks[i][1], 5, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(123,47,255,${pulse * 0.5})`;
      ctx.lineWidth = 1; ctx.stroke();
    }
  }
  const meshInterval = setInterval(drawFaceMesh, 40);

  const dotEls = grid.querySelectorAll("div");
  const fill = overlay.querySelector("#scanBarFill");
  const lbl = overlay.querySelector("#scanLabel");
  const steps = ["Mapping Facial Geometry...", "Analyzing 128 Landmarks...", "Verifying Identity..."];
  const total = 2800;
  const start = performance.now();

  /* Reveal landmarks + grid dots over time */
  const revealInterval = setInterval(() => {
    if (revealCount < landmarks.length) revealCount++;
    const dotIdx = Math.floor((revealCount / landmarks.length) * dotCount);
    for (let i = 0; i < dotIdx; i++) {
      dotEls[i].style.background = "#7b2fff";
      dotEls[i].style.transform = "scale(1.3)";
    }
  }, total / landmarks.length);

  function updateProgress(now) {
    const elapsed = now - start;
    const pct = Math.min((elapsed / total) * 100, 100);
    fill.style.width = pct + "%";
    lbl.textContent = steps[pct < 33 ? 0 : pct < 66 ? 1 : 2];
    if (elapsed < total) { requestAnimationFrame(updateProgress); }
    else {
      clearInterval(meshInterval); clearInterval(revealInterval);
      overlay.remove(); onComplete();
    }
  }
  requestAnimationFrame(updateProgress);
}

/* ----------- TYPE 3: FORENSICS — Layer-by-layer Document Scan ----------- */
function showForensicsOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "scan-overlay-full";
  overlay.innerHTML = `
    <div class="scan-animation-wrap">
      <div class="scan-title-overlay" style="color:var(--green)">DOCUMENT FORENSIC ANALYSIS</div>
      <div style="position:relative;width:220px;height:160px;margin:10px 0" id="docWrap">
        <canvas id="docCanvas" width="220" height="160" style="position:absolute;inset:0;border:1px solid rgba(0,255,136,0.3);border-radius:4px"></canvas>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;width:220px" id="layerRows">
        <div class="flayer" data-idx="0">
          <span class="flayer-dot"></span>
          <span class="flayer-label">METADATA LAYER</span>
          <span class="flayer-status">SCANNING...</span>
        </div>
        <div class="flayer" data-idx="1">
          <span class="flayer-dot"></span>
          <span class="flayer-label">INK PATTERN LAYER</span>
          <span class="flayer-status">PENDING</span>
        </div>
        <div class="flayer" data-idx="2">
          <span class="flayer-dot"></span>
          <span class="flayer-label">SERIAL VERIFICATION</span>
          <span class="flayer-status">PENDING</span>
        </div>
      </div>
      <div class="scan-progress-label" id="scanLabel" style="color:var(--green);margin-top:8px">Analyzing Metadata Layer...</div>
      <div class="scan-bar-wrap" style="margin-top:8px"><div class="scan-bar-fill" id="scanBarFill" style="background:linear-gradient(90deg,var(--green),#00ccaa)"></div></div>
    </div>
    <style>
      .flayer{display:flex;align-items:center;gap:8px;padding:5px 10px;border:1px solid rgba(0,255,136,0.15);border-radius:4px;background:rgba(0,255,136,0.04);font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px}
      .flayer-dot{width:7px;height:7px;border-radius:50%;background:rgba(0,255,136,0.2);flex-shrink:0;transition:background 0.4s,box-shadow 0.4s}
      .flayer-label{flex:1;color:rgba(180,240,200,0.7)}
      .flayer-status{color:rgba(0,255,136,0.5)}
      .flayer.active .flayer-dot{background:var(--green);box-shadow:0 0 8px var(--green);animation:fDotBlink 0.6s ease-in-out infinite}
      .flayer.active .flayer-status{color:var(--green)}
      .flayer.done .flayer-dot{background:var(--green);box-shadow:0 0 6px var(--green)}
      .flayer.done .flayer-status{color:var(--green)}
      @keyframes fDotBlink{0%,100%{opacity:1}50%{opacity:0.3}}
    </style>
  `;
  document.body.appendChild(overlay);

  const dc = overlay.querySelector("#docCanvas");
  const ctx = dc.getContext("2d");
  let frameCount = 0;
  let currentLayer = 0; // 0=meta,1=ink,2=serial

  const layerColors = [
    [0,255,136],
    [255,200,0],
    [0,191,255]
  ];

  function drawDoc() {
    frameCount++;
    const [r,g,b] = layerColors[Math.min(currentLayer, 2)];

    ctx.clearRect(0, 0, 220, 160);

    /* Doc background */
    ctx.fillStyle = "rgba(0,20,10,0.6)";
    ctx.fillRect(0, 0, 220, 160);

    /* Horizontal text lines (faux document content) */
    for (let row = 0; row < 9; row++) {
      const y = 18 + row * 16;
      const lineAlpha = 0.08 + 0.04 * Math.sin(frameCount * 0.05 + row);
      ctx.fillStyle = `rgba(${r},${g},${b},${lineAlpha})`;
      const lineW = row === 0 ? 120 : row === 2 ? 90 : 180 - (row % 3) * 20;
      ctx.fillRect(16, y, lineW, 5);
      /* Random highlight pixels for "ink scan" layer */
      if (currentLayer === 1 && Math.random() > 0.94) {
        ctx.fillStyle = `rgba(255,200,0,0.7)`;
        ctx.fillRect(16 + Math.random() * lineW, y, 3, 5);
      }
    }

    /* Serial number box (layer 3) */
    if (currentLayer >= 2) {
      ctx.strokeStyle = `rgba(0,191,255,0.6)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(140, 110, 68, 28);
      ctx.fillStyle = `rgba(0,191,255,${0.5 + 0.3*Math.sin(frameCount*0.1)})`;
      ctx.font = "8px 'Share Tech Mono', monospace";
      ctx.fillText("SN-2026-AX7F", 144, 122);
      ctx.fillText("VERIFIED", 152, 132);
    }

    /* Scanning beam */
    const beamY = ((frameCount * 1.2) % 160);
    const beam = ctx.createLinearGradient(0, beamY - 8, 0, beamY + 8);
    beam.addColorStop(0, "transparent");
    beam.addColorStop(0.5, `rgba(${r},${g},${b},0.35)`);
    beam.addColorStop(1, "transparent");
    ctx.fillStyle = beam;
    ctx.fillRect(0, beamY - 8, 220, 16);

    /* Corner brackets */
    ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
    ctx.lineWidth = 1.5;
    [[0,0],[200,0],[0,140],[200,140]].forEach(([cx,cy],i) => {
      const ox = i % 2 === 0 ? 10 : -10, oy = i < 2 ? 10 : -10;
      ctx.beginPath(); ctx.moveTo(cx+ox,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+oy); ctx.stroke();
    });
  }
  const docInterval = setInterval(drawDoc, 40);

  /* Layer progression */
  const layerEls = overlay.querySelectorAll(".flayer");
  layerEls[0].classList.add("active");
  const fill = overlay.querySelector("#scanBarFill");
  const lbl = overlay.querySelector("#scanLabel");
  const total = 2800;
  const start = performance.now();
  const layerTimes = [0, total * 0.33, total * 0.66];
  const layerLabels = ["Analyzing Metadata Layer...", "Scanning Ink Patterns...", "Verifying Serial Number..."];
  let lastLayer = -1;

  function updateProgress(now) {
    const elapsed = now - start;
    const pct = Math.min((elapsed / total) * 100, 100);
    fill.style.width = pct + "%";

    currentLayer = pct < 33 ? 0 : pct < 66 ? 1 : 2;
    if (currentLayer !== lastLayer) {
      lastLayer = currentLayer;
      lbl.textContent = layerLabels[currentLayer];
      layerEls.forEach((el, i) => {
        el.classList.remove("active", "done");
        if (i < currentLayer) { el.classList.add("done"); el.querySelector(".flayer-status").textContent = "✓ CLEAR"; }
        else if (i === currentLayer) { el.classList.add("active"); el.querySelector(".flayer-status").textContent = "SCANNING..."; }
      });
    }

    if (elapsed < total) { requestAnimationFrame(updateProgress); }
    else {
      layerEls.forEach(el => { el.classList.remove("active"); el.classList.add("done"); el.querySelector(".flayer-status").textContent = "✓ CLEAR"; });
      clearInterval(docInterval);
      setTimeout(() => { overlay.remove(); onComplete(); }, 300);
    }
  }
  requestAnimationFrame(updateProgress);
}

/* ----------- TYPE 4: NETWORK — Pulse Node Graph ----------- */
function showNetworkOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "scan-overlay-full";
  overlay.innerHTML = `
    <div class="scan-animation-wrap">
      <div class="scan-title-overlay" style="color:#00bfff">NETWORK INTELLIGENCE SCAN</div>
      <canvas id="netCanvas" width="240" height="200" style="margin:8px 0;border:1px solid rgba(0,191,255,0.2);border-radius:8px;background:rgba(0,10,30,0.6)"></canvas>
      <div style="display:flex;gap:14px;margin:4px 0" id="netStats">
        <div style="text-align:center;font-family:'Share Tech Mono',monospace;font-size:10px">
          <div style="color:#00bfff;font-size:18px;font-weight:700" id="nodeCount">0</div>
          <div style="color:rgba(180,220,240,0.5)">NODES</div>
        </div>
        <div style="text-align:center;font-family:'Share Tech Mono',monospace;font-size:10px">
          <div style="color:#ff2b5e;font-size:18px;font-weight:700" id="flagCount">0</div>
          <div style="color:rgba(180,220,240,0.5)">FLAGGED</div>
        </div>
        <div style="text-align:center;font-family:'Share Tech Mono',monospace;font-size:10px">
          <div style="color:#00ff88;font-size:18px;font-weight:700" id="clearCount">0</div>
          <div style="color:rgba(180,220,240,0.5)">CLEARED</div>
        </div>
      </div>
      <div class="scan-progress-label" id="scanLabel" style="color:#00bfff">Mapping Social Graph...</div>
      <div class="scan-bar-wrap"><div class="scan-bar-fill" id="scanBarFill" style="background:linear-gradient(90deg,#00bfff,#0066ff)"></div></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const nc = overlay.querySelector("#netCanvas");
  const ctx = nc.getContext("2d");
  let frameCount = 0;

  /* Generate nodes */
  const centerNode = { x: 120, y: 100, r: 10, color: "#00bfff", label: "SUBJECT", flagged: false, revealed: true };
  const surrounding = [];
  const nodeCount = 14;
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const dist = 55 + (i % 3) * 22;
    surrounding.push({
      x: 120 + dist * Math.cos(angle),
      y: 100 + dist * Math.sin(angle),
      r: 5 + Math.random() * 3,
      color: Math.random() > 0.75 ? "#ff2b5e" : "#00ff88",
      flagged: Math.random() > 0.75,
      revealed: false,
      revealAt: (i / nodeCount) * 2400 + 200,
      pulsePhase: Math.random() * Math.PI * 2
    });
  }
  /* Secondary ring */
  const secondary = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.3;
    const parentIdx = Math.floor(Math.random() * nodeCount);
    const parent = surrounding[parentIdx];
    secondary.push({
      x: parent.x + 30 * Math.cos(angle * 1.5),
      y: parent.y + 30 * Math.sin(angle * 1.5),
      r: 3, color: "#00bfff", revealed: false,
      revealAt: 1400 + i * 130, parentIdx
    });
  }

  let nodeDisplayCount = 0, flagDisplayCount = 0, clearDisplayCount = 0;

  function drawNetwork(elapsed) {
    ctx.clearRect(0, 0, 240, 200);
    frameCount++;

    /* Draw connection lines */
    surrounding.forEach((n, i) => {
      if (!n.revealed) return;
      ctx.beginPath();
      ctx.moveTo(centerNode.x, centerNode.y);
      ctx.lineTo(n.x, n.y);
      const pulse = 0.15 + 0.1 * Math.sin(frameCount * 0.06 + n.pulsePhase);
      ctx.strokeStyle = `rgba(0,191,255,${pulse})`;
      ctx.lineWidth = 0.8; ctx.stroke();

      /* Secondary connections */
      secondary.forEach(s => {
        if (!s.revealed || s.parentIdx !== i) return;
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = "rgba(0,191,255,0.1)";
        ctx.lineWidth = 0.5; ctx.stroke();
      });
    });

    /* Pulse ripple from center */
    const rippleR = ((frameCount * 1.2) % 80) + 10;
    ctx.beginPath(); ctx.arc(centerNode.x, centerNode.y, rippleR, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(0,191,255,${Math.max(0, 0.3 - rippleR/120)})`;
    ctx.lineWidth = 1; ctx.stroke();

    /* Draw secondary nodes */
    secondary.forEach(s => {
      if (!s.revealed) return;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = "rgba(0,191,255,0.5)"; ctx.fill();
    });

    /* Draw surrounding nodes */
    surrounding.forEach(n => {
      if (!n.revealed) return;
      n.pulsePhase += 0.04;
      const pulse = 0.7 + 0.3 * Math.sin(n.pulsePhase);
      /* Outer glow */
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI*2);
      ctx.fillStyle = n.flagged ? `rgba(255,43,94,0.15)` : `rgba(0,255,136,0.12)`;
      ctx.fill();
      /* Node */
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
      ctx.fillStyle = n.flagged ? `rgba(255,43,94,${pulse})` : `rgba(0,255,136,${pulse})`;
      ctx.fill();
    });

    /* Draw center node */
    ctx.beginPath(); ctx.arc(centerNode.x, centerNode.y, centerNode.r + 5, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(0,191,255,0.4)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(centerNode.x, centerNode.y, centerNode.r, 0, Math.PI*2);
    ctx.fillStyle = "#00bfff"; ctx.fill();
    ctx.fillStyle = "#001020"; ctx.font = "bold 6px monospace"; ctx.textAlign = "center";
    ctx.fillText("S", centerNode.x, centerNode.y + 2);

    /* Reveal nodes over time */
    surrounding.forEach(n => { if (!n.revealed && elapsed >= n.revealAt) { n.revealed = true; nodeDisplayCount++; if (n.flagged) flagDisplayCount++; else clearDisplayCount++; } });
    secondary.forEach(s => { if (!s.revealed && elapsed >= s.revealAt) s.revealed = true; });

    /* Update counters */
    overlay.querySelector("#nodeCount").textContent = nodeDisplayCount;
    overlay.querySelector("#flagCount").textContent = flagDisplayCount;
    overlay.querySelector("#clearCount").textContent = clearDisplayCount;
  }

  const fill = overlay.querySelector("#scanBarFill");
  const lbl = overlay.querySelector("#scanLabel");
  const steps = ["Mapping Social Graph...", "Analyzing Location Data...", "Cross-referencing Identities..."];
  const total = 2800;
  const start = performance.now();

  function updateProgress(now) {
    const elapsed = now - start;
    const pct = Math.min((elapsed / total) * 100, 100);
    fill.style.width = pct + "%";
    lbl.textContent = steps[pct < 33 ? 0 : pct < 66 ? 1 : 2];
    drawNetwork(elapsed);
    if (elapsed < total) { requestAnimationFrame(updateProgress); }
    else { overlay.remove(); onComplete(); }
  }
  requestAnimationFrame(updateProgress);
}

/* ========================= BOOT SEQUENCE ========================= */
function runBootSequence(onComplete) {
  const bootOverlay = document.createElement("div");
  bootOverlay.id = "bootOverlay";
  bootOverlay.innerHTML = `
    <div class="boot-logo-area">JusticeFlowX</div>
    <div class="boot-subtitle">BIOMETRIC VERIFICATION SYSTEM v2.4</div>
    <div class="boot-progress-bar"><div class="boot-progress-fill" id="bootProgressFill"></div></div>
    <div id="bootLog"></div>
  `;
  document.body.appendChild(bootOverlay);
  const bootLog = bootOverlay.querySelector("#bootLog");
  const progressFill = bootOverlay.querySelector("#bootProgressFill");
  const bootMessages = [
    { text: "Kernel handshake complete", type: "ok" },
    { text: "Initializing biometric subsystem...", type: "" },
    { text: "Fingerprint module — ONLINE", type: "ok" },
    { text: "Facial recognition engine — ONLINE", type: "ok" },
    { text: "Syncing criminal database [14,217 records]...", type: "" },
    { text: "Database sync complete", type: "ok" },
    { text: "Loading surveillance grid overlay...", type: "" },
    { text: "Encryption layer — 256-bit AES active", type: "ok" },
    { text: "Threat detection module updated", type: "ok" },
    { text: "All systems nominal — READY", type: "ok" },
  ];
  let idx = 0;
  const interval = setInterval(() => {
    if (idx < bootMessages.length) {
      const { text, type } = bootMessages[idx];
      const div = document.createElement("div");
      div.textContent = text;
      if (type) div.classList.add(type);
      bootLog.appendChild(div);
      bootLog.scrollTop = bootLog.scrollHeight;
      progressFill.style.width = ((idx + 1) / bootMessages.length * 100) + "%";
      idx++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        bootOverlay.style.transition = "opacity 0.6s ease";
        bootOverlay.style.opacity = "0";
        setTimeout(() => { bootOverlay.remove(); onComplete(); }, 650);
      }, 400);
    }
  }, 380);
}

/* ========================= TERMINAL LOGS ========================= */
function startTerminal() {
  const termBody = document.getElementById("terminalBody");
  const termTime = document.getElementById("termTime");
  if (!termBody) return;
  const logs = [
    { text: "Fingerprint module ping — 2ms", type: "" },
    { text: "ALERT: Drone sector 7B activated", type: "alert" },
    { text: "Facial DB sync complete (14,217)", type: "ok" },
    { text: "Firewall scan — no anomalies", type: "ok" },
    { text: "ALERT: Unauthorized access blocked", type: "alert" },
    { text: "AI threat detection update pushed", type: "" },
    { text: "Biometric reader — standby mode", type: "" },
    { text: "WARN: Node 4C response degraded", type: "warn" },
    { text: "Encryption handshake verified", type: "ok" },
    { text: "Surveillance feed reconnected", type: "ok" },
    { text: "Case DB query completed (0.4ms)", type: "" },
    { text: "WARN: CPU spike — 78% peak", type: "warn" },
    { text: "Memory pool optimized", type: "ok" },
    { text: "Auth attempt from 192.168.1.44 — denied", type: "alert" },
  ];
  setInterval(() => {
    const { text, type } = logs[Math.floor(Math.random() * logs.length)];
    const div = document.createElement("div");
    div.textContent = text;
    if (type) div.classList.add(type);
    termBody.appendChild(div);
    if (termBody.children.length > 20) termBody.removeChild(termBody.firstChild);
    termBody.scrollTop = termBody.scrollHeight;
  }, 1600);
  setInterval(() => { if (termTime) termTime.textContent = new Date().toTimeString().slice(0, 8); }, 1000);
}

/* ========================= STAT COUNTER ========================= */
function animateStats() {
  document.querySelectorAll(".stat-val").forEach(el => {
    const target = parseFloat(el.getAttribute("data-count"));
    const isDecimal = target % 1 !== 0;
    const duration = 1800, startTime = performance.now();
    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = target * eased;
      el.textContent = isDecimal ? val.toFixed(1) : Math.round(val);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

/* ========================= BRAND GLITCH ========================= */
function initBrandGlitch() {
  const brand = document.querySelector(".brand");
  if (!brand) return;
  brand.setAttribute("data-text", brand.textContent);
  setInterval(() => {
    brand.style.transform = `translate(${(Math.random() - 0.5) * 3}px, ${(Math.random() - 0.5) * 2}px)`;
    brand.style.filter = `hue-rotate(${Math.random() * 30}deg)`;
    setTimeout(() => { brand.style.transform = "translate(0,0)"; brand.style.filter = ""; }, 100);
  }, 3000);
}

/* ========================= HOVER SOUND ========================= */
function initHoverSound() {
  const scanSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-interface-zoom-890.mp3");
  scanSound.volume = 0.4;
  document.querySelectorAll(".scan-btn").forEach(btn => {
    btn.addEventListener("mouseenter", () => { scanSound.currentTime = 0; scanSound.play().catch(() => {}); });
  });
}

/* ========================= SCAN BUTTONS — ROUTE BY TYPE ========================= */
function initScanButtons() {
  document.querySelectorAll(".scan-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const type = btn.getAttribute("data-type") || "finger";
      const href = btn.getAttribute("href");

      function afterScan() {
        requestPassword(() => { if (href) window.location.href = href; });
      }

      switch (type) {
        case "finger":   showFingerprintOverlay(afterScan); break;
        case "face":     showFacialOverlay(afterScan);      break;
        case "forensic": showForensicsOverlay(afterScan);   break;
        case "network":  showNetworkOverlay(afterScan);     break;
        default:         showFingerprintOverlay(afterScan); break;
      }
    });
  });
}

/* ========================= MENU DROPDOWN ========================= */
function initMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const dropdown = document.getElementById("menuDropdown");
  if (!menuBtn || !dropdown) return;
  menuBtn.addEventListener("click", e => { e.stopPropagation(); dropdown.classList.toggle("show"); });
  document.addEventListener("click", () => dropdown.classList.remove("show"));
}

/* ========================= LOGOUT ========================= */
function initLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", e => {
    e.preventDefault();
    window.close();
    setTimeout(() => { alert("You have been logged out. Please close the tab manually if it didn't close automatically."); window.location.href = "about:blank"; }, 100);
  });
}

/* ========================= MAIN INIT ========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("[JusticeFlowX] DOM Ready — Launching boot sequence");
  initHexCanvas();
  initDataStreams();
  initParticles();
  runBootSequence(() => {
    startClock();
    startCpuMeter();
    startMarquee();
    initBrandGlitch();
    initHoverSound();
    initScanButtons();
    initMenu();
    initLogout();
    startTerminal();
    animateStats();
    console.log("[JusticeFlowX] All systems online.");
  });
});