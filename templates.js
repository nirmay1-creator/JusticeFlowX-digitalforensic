/* ============================================================
   JusticeFlowX — Facial Recognition Frontend
   Uses face-api.js for real browser-side face detection
   ============================================================ */

const BACKEND_URL = "http://127.0.0.1:8675";
const CDN_MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

let stream = null;
let detectionLoop = null;
let modelsLoaded = false;
let faceDetected = false;
let frameCount = 0;
let lastFpsTime = performance.now();
let scanMode = "full";
let isScanning = false;
let capturedDescriptor = null;
let lastExpressions = null;
let lastLandmarks = null;

// DOM refs
const video       = document.getElementById("video");
const faceCanvas  = document.getElementById("faceCanvas");
const scanBtn     = document.getElementById("scanBtn");
const scanBtnText = document.getElementById("scanBtnText");
const btnLoader   = document.getElementById("btnLoader");
const stopBtn     = document.getElementById("stopBtn");
const cameraFrame = document.getElementById("cameraFrame");
const standby     = document.getElementById("cameraStandby");
const standbyText = document.getElementById("standbyText");
const standbySub  = document.getElementById("standbySub");
const sweepLine   = document.getElementById("sweepLine");
const faceHud     = document.getElementById("faceHud");
const camBottomBar= document.getElementById("cameraBottomBar");
const cbbFaceStatus = document.getElementById("cbbFaceStatus");
const cbbFps      = document.getElementById("cbbFps");
const hudPose     = document.getElementById("hudPose");
const hudExpr     = document.getElementById("hudExpr");
const hudConf     = document.getElementById("hudConf");
const hudLnmk     = document.getElementById("hudLnmk");
const resultsArea = document.getElementById("resultsArea");
const modelStatus = document.getElementById("modelStatus");
const backendStatus = document.getElementById("backendStatus");
const systemStatusDot  = document.getElementById("systemStatusDot");
const systemStatusText = document.getElementById("systemStatusText");
const scanProgressOverlay = document.getElementById("scanProgressOverlay");
const spoTitle    = document.getElementById("spoTitle");
const spoBar      = document.getElementById("spoBar");
const spoStep     = document.getElementById("spoStep");

/* ========================
   UTILITIES
   ======================== */
function r(min, max) { return Math.random() * (max - min) + min; }

function addTerminalLog(text, type = "") {
  const body = document.getElementById("terminalBody");
  if (!body) return;
  const div = document.createElement("div");
  div.textContent = text;
  if (type) div.classList.add(type);
  body.appendChild(div);
  if (body.children.length > 25) body.removeChild(body.firstChild);
  body.scrollTop = body.scrollHeight;
}

function setStep(num, state) {
  // state: 'active' | 'done' | 'idle'
  const el = document.getElementById(`step${num}`);
  const ss = document.getElementById(`ss${num}`);
  if (!el || !ss) return;
  el.className = "step-item " + state;
  if (state === "done") ss.innerHTML = "<i class='bx bx-check-circle'></i>";
  else if (state === "active") ss.innerHTML = "<i class='bx bx-loader-alt'></i>";
  else ss.innerHTML = "<i class='bx bx-time'></i>";
}

function resetSteps() {
  [1,2,3,4].forEach(n => setStep(n, "idle"));
}

function setScanProgress(pct, title, step) {
  spoTitle.textContent = title;
  spoBar.style.width = pct + "%";
  spoStep.textContent = step;
}

function flashScreen(color = "cyan") {
  const f = document.createElement("div");
  f.className = "scan-flash" + (color === "red" ? " red" : "");
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 500);
}

/* ========================
   CLOCK
   ======================== */
function startClock() {
  const el = document.getElementById("clockDisplay");
  const tt = document.getElementById("termTime");
  const tick = () => {
    const t = new Date().toTimeString().slice(0, 8);
    if (el) el.textContent = t;
    if (tt) tt.textContent = t;
  };
  tick(); setInterval(tick, 1000);
}

/* ========================
   HEX CANVAS
   ======================== */
function initHexCanvas() {
  const canvas = document.getElementById("hexCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize(); addEventListener("resize", resize);
  const hs = 36;
  const cols = Math.ceil(innerWidth  / (hs * 1.75)) + 2;
  const rows = Math.ceil(innerHeight / (hs * 1.55)) + 2;
  const hexes = [];
  for (let rr = 0; rr < rows; rr++)
    for (let c = 0; c < cols; c++)
      hexes.push({ x: c * hs * 1.75 + (rr % 2 === 0 ? 0 : hs * 0.875), y: rr * hs * 1.55, alpha: r(0, 0.15), sp: r(0.002, 0.006), ph: r(0, Math.PI * 2), act: false, t: 0 });
  setInterval(() => { const h = hexes[Math.floor(r(0, hexes.length))]; if (!h.act) { h.act = true; h.t = 60; } }, 200);
  const drawHex = (x, y, sz, al, bright) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const ang = (Math.PI/3)*i - Math.PI/6; i === 0 ? ctx.moveTo(x+sz*Math.cos(ang), y+sz*Math.sin(ang)) : ctx.lineTo(x+sz*Math.cos(ang), y+sz*Math.sin(ang)); }
    ctx.closePath();
    ctx.strokeStyle = bright ? `rgba(0,245,255,${al*3})` : `rgba(0,180,200,${al})`;
    ctx.lineWidth = bright ? 1.2 : 0.6; ctx.stroke();
  };
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexes.forEach(h => {
      h.ph += h.sp;
      const p = 0.04 + Math.sin(h.ph) * 0.035;
      if (h.act) { h.t--; if (h.t <= 0) h.act = false; drawHex(h.x, h.y, hs-2, p*4, true); }
      else drawHex(h.x, h.y, hs-2, p, false);
    });
    requestAnimationFrame(animate);
  };
  animate();
}

/* ========================
   DATA STREAMS + PARTICLES
   ======================== */
function initDataStreams() {
  const c = document.getElementById("dataStreams"); if (!c) return;
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("div"); s.className = "data-stream";
    s.style.left = r(0,100) + "vw";
    s.style.animationDuration = r(6,18) + "s";
    s.style.animationDelay = r(0,12) + "s";
    s.style.height = r(80,220) + "px";
    c.appendChild(s);
  }
}
function initParticles() {
  const colors = ["#00f5ff","#7b2fff","#00ff88","#ffffff"];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div"); p.className = "particle";
    const sz = r(1.5, 3.5);
    p.style.cssText = `width:${sz}px;height:${sz}px;left:${r(0,100)}vw;bottom:-10px;animation-duration:${r(12,28)}s;animation-delay:${r(0,20)}s;`;
    const col = colors[Math.floor(r(0, colors.length))];
    p.style.background = col; p.style.boxShadow = `0 0 6px ${col}`;
    document.body.appendChild(p);
  }
}

/* ========================
   TERMINAL AUTO LOGS
   ======================== */
function startTerminal() {
  const logs = [
    ["Face-api.js landmark engine — active","ok"],
    ["ALERT: Unknown subject in camera feed","alert"],
    ["Criminal DB sync complete (14,217 entries)","ok"],
    ["Liveness detection — pass","ok"],
    ["WARN: Confidence below threshold","warn"],
    ["Eye region extracted — 64 vectors",""],
    ["Jawline geometry mapped — 17 pts",""],
    ["ALERT: Partial occlusion detected","alert"],
    ["Expression neutral — probability 0.89","ok"],
    ["Backend health check — 200 OK","ok"],
    ["WARN: Lighting variance detected","warn"],
    ["68-point landmark array complete","ok"],
    ["Subject identity — pending match",""],
    ["Firewall check — no intrusion","ok"],
  ];
  setInterval(() => {
    const [text, type] = logs[Math.floor(r(0, logs.length))];
    addTerminalLog(text, type);
  }, 2000);
}

/* ========================
   MODE TABS
   ======================== */
function initModeTabs() {
  document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      scanMode = tab.dataset.mode;
      addTerminalLog(`Scan mode changed to: ${scanMode.toUpperCase()}`);
    });
  });
}

/* ========================
   USER ID INPUT PING
   ======================== */
function initUserIdInput() {
  const input = document.getElementById("user_id");
  const ping  = document.getElementById("inputPing");
  if (!input) return;
  input.addEventListener("input", () => {
    ping.classList.toggle("active", input.value.trim().length > 0);
  });
}

/* ========================
   BACKEND HEALTH CHECK
   ======================== */
async function checkBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.status) {
      backendStatus.textContent = "ONLINE";
      backendStatus.className = "ok";
      addTerminalLog("Backend server connected — ready", "ok");
      return true;
    }
  } catch {
    backendStatus.textContent = "OFFLINE";
    backendStatus.className = "alert";
    addTerminalLog("ALERT: Backend server offline — check Flask", "alert");
    return false;
  }
}

/* ========================
   LOAD FACE-API MODELS
   ======================== */
async function loadModels() {
  addTerminalLog("Loading face-api.js models from CDN...");
  modelStatus.textContent = "Loading...";

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(CDN_MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(CDN_MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(CDN_MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(CDN_MODEL_URL),
    ]);
    modelsLoaded = true;
    modelStatus.textContent = "Loaded ✓";
    modelStatus.style.color = "var(--green)";
    scanBtn.disabled = false;
    scanBtnText.textContent = "INITIATE SCAN";
    btnLoader.classList.remove("active");
    systemStatusDot.classList.add("online");
    systemStatusText.textContent = "SYSTEMS ONLINE";
    systemStatusText.classList.add("online");
    addTerminalLog("All models loaded — fingerprint + landmark + expression", "ok");
  } catch (err) {
    modelStatus.textContent = "Failed";
    modelStatus.style.color = "var(--red)";
    addTerminalLog("ALERT: Model load failed — " + err.message, "alert");
    scanBtnText.textContent = "MODEL ERROR";
    console.error(err);
  }
}

/* ========================
   CAMERA
   ======================== */
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
    video.srcObject = stream;
    video.style.display = "block";
    standby.classList.add("hidden");
    cameraFrame.classList.add("active");
    sweepLine.style.display = "block";
    camBottomBar.style.display = "flex";
    faceHud.style.display = "flex";
    stopBtn.style.display = "flex";
    scanBtnText.textContent = "CAPTURE & ANALYZE";
    addTerminalLog("Camera stream activated — 640×480", "ok");
    startDetectionLoop();
    return true;
  } catch (err) {
    addTerminalLog("ALERT: Camera access denied — " + err.message, "alert");
    alert("Camera error: " + err.message);
    return false;
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  if (detectionLoop) { cancelAnimationFrame(detectionLoop); detectionLoop = null; }
  video.style.display = "none";
  video.srcObject = null;
  const ctx = faceCanvas.getContext("2d");
  ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  standby.classList.remove("hidden");
  standbyText.textContent = "AWAITING SUBJECT";
  standbySub.textContent = "Click 'Initiate Scan' to activate camera";
  cameraFrame.classList.remove("active", "face-found");
  sweepLine.style.display = "none";
  camBottomBar.style.display = "none";
  faceHud.style.display = "none";
  stopBtn.style.display = "none";
  scanBtnText.textContent = "INITIATE SCAN";
  faceDetected = false;
  addTerminalLog("Camera stream stopped");
}

/* ========================
   REAL-TIME FACE DETECTION LOOP
   ======================== */
async function startDetectionLoop() {
  if (!modelsLoaded) return;

  // Wait until video is actually ready
  if (video.readyState < 2) {
    console.log("⏳ Waiting for video...");
    setTimeout(startDetectionLoop, 500);
    return;
  }

  console.log("✅ Detection loop started");

  async function detect() {
    if (!stream || isScanning) {
      detectionLoop = requestAnimationFrame(detect);
      return;
    }

    faceCanvas.width  = video.videoWidth || 640;
    faceCanvas.height = video.videoHeight || 480;

    const ctx = faceCanvas.getContext("2d");
    ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

    try {
      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,        // 🔥 higher = better detection
            scoreThreshold: 0.3    // 🔥 lower = more sensitive
          })
        )
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

      console.log("Detections:", detections.length);

      if (detections.length > 0) {
        const d = detections[0];

        faceDetected = true;
        cameraFrame.classList.add("face-found");
        cbbFaceStatus.textContent = "FACE LOCKED";
        cbbFaceStatus.classList.add("face-ok");

        capturedDescriptor = d.descriptor;
        lastExpressions = d.expressions;
        lastLandmarks = d.landmarks;

        drawCustomBox(ctx, d.detection.box, d.detection.score);
        drawLandmarks(ctx, d.landmarks.positions);
        drawExpressionOverlay(ctx, d.expressions, d.detection.box);

        const topExpr = Object.entries(d.expressions)
          .sort((a,b) => b[1]-a[1])[0];

        hudExpr.textContent = topExpr[0].toUpperCase().slice(0,4);
        hudConf.textContent = (d.detection.score * 100).toFixed(0) + "%";
        hudLnmk.textContent = d.landmarks.positions.length;
        hudPose.textContent = estimatePose(d.landmarks);

      } else {
        faceDetected = false;
        cameraFrame.classList.remove("face-found");
        cbbFaceStatus.textContent = "NO FACE DETECTED";
        cbbFaceStatus.classList.remove("face-ok");

        hudPose.textContent = "—";
        hudExpr.textContent = "—";
        hudConf.textContent = "—";
        hudLnmk.textContent = "—";
      }

      // FPS counter
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        cbbFps.textContent = frameCount + " FPS";
        frameCount = 0;
        lastFpsTime = now;
      }

    } catch (err) {
      console.error("Detection error:", err);
    }

    detectionLoop = requestAnimationFrame(detect);
  }

  detectionLoop = requestAnimationFrame(detect);
}
/* ========================
   CUSTOM DRAWING FUNCTIONS
   ======================== */
function drawCustomBox(ctx, box, score) {
  const { x, y, width, height } = box;
  const cornerLen = 20;
  const col = score > 0.8 ? "#00ff88" : "#00f5ff";

  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.shadowColor = col;
  ctx.shadowBlur = 12;

  // Corner brackets only
  const corners = [[x,y,1,1],[x+width,y,-1,1],[x,y+height,1,-1],[x+width,y+height,-1,-1]];
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * cornerLen, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * cornerLen);
    ctx.stroke();
  });

  // Center crosshair at face center
  const fc = { x: x + width/2, y: y + height/2 };
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(0,245,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(fc.x - 10, fc.y); ctx.lineTo(fc.x + 10, fc.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(fc.x, fc.y - 10); ctx.lineTo(fc.x, fc.y + 10); ctx.stroke();

  // Score label
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,10,20,0.7)";
  ctx.fillRect(x, y - 22, 90, 20);
  ctx.fillStyle = col;
  ctx.font = "bold 10px 'Share Tech Mono'";
  ctx.fillText(`FACE ${(score*100).toFixed(0)}% CONF`, x + 4, y - 6);
}

function drawLandmarks(ctx, positions) {
  ctx.fillStyle = "rgba(0,245,255,0.7)";
  ctx.shadowColor = "var(--cyan)"; ctx.shadowBlur = 3;
  positions.forEach(pt => {
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2); ctx.fill();
  });
  ctx.shadowBlur = 0;

  // Connect key regions with lines
  const regions = [
    [0,16],   // jaw
    [17,21],  // left eyebrow
    [22,26],  // right eyebrow
    [27,30],  // nose bridge
    [31,35],  // nose bottom
    [36,41],  // left eye (closed)
    [42,47],  // right eye (closed)
    [48,59],  // outer lip
    [60,67],  // inner lip
  ];
  ctx.strokeStyle = "rgba(0,245,255,0.2)";
  ctx.lineWidth = 0.8;
  regions.forEach(([start, end]) => {
    ctx.beginPath();
    for (let i = start; i <= end; i++) {
      if (!positions[i]) continue;
      i === start ? ctx.moveTo(positions[i].x, positions[i].y) : ctx.lineTo(positions[i].x, positions[i].y);
    }
    if ([36,42,48,60].includes(start)) ctx.closePath(); // close loops
    ctx.stroke();
  });
}

function drawExpressionOverlay(ctx, expressions, box) {
  const topExprs = Object.entries(expressions).sort((a,b) => b[1]-a[1]).slice(0,3);
  const startX = box.x;
  let startY = box.y + box.height + 10;

  topExprs.forEach(([label, val], i) => {
    const barW = Math.min(box.width, 120);
    const barH = 4;
    const y = startY + i * 14;

    ctx.fillStyle = "rgba(0,10,20,0.6)";
    ctx.fillRect(startX, y - 12, barW + 60, 13);

    ctx.fillStyle = "rgba(0,245,255,0.5)";
    ctx.font = "9px 'Share Tech Mono'";
    ctx.fillText(label.slice(0,4).toUpperCase(), startX + 2, y);

    ctx.fillStyle = "rgba(0,245,255,0.15)";
    ctx.fillRect(startX + 34, y - 8, barW, barH);
    ctx.fillStyle = val > 0.7 ? "#00ff88" : val > 0.3 ? "#00f5ff" : "rgba(0,245,255,0.4)";
    ctx.fillRect(startX + 34, y - 8, barW * val, barH);

    ctx.fillStyle = "rgba(0,245,255,0.7)";
    ctx.fillText((val * 100).toFixed(0) + "%", startX + 36 + barW, y);
  });
}

function estimatePose(landmarks) {
  const pts = landmarks.positions;
  if (!pts || pts.length < 68) return "FRONT";
  const nose = pts[30];
  const leftEye  = pts[36];
  const rightEye = pts[45];
  const eyeMid = { x: (leftEye.x + rightEye.x) / 2 };
  const diff = nose.x - eyeMid.x;
  const spread = Math.abs(rightEye.x - leftEye.x);
  const ratio = diff / spread;
  if (ratio < -0.2) return "LEFT";
  if (ratio >  0.2) return "RIGHT";
  return "FRONT";
}

/* ========================
   SCAN + SEND TO BACKEND
   ======================== */
async function performScan() {
  const userId = document.getElementById("user_id").value.trim();
  if (!userId) { alert("Please enter a Subject ID first!"); return; }

  if (!stream) {
    const ok = await startCamera();
    if (!ok) return;
    scanBtnText.textContent = "CAPTURE & ANALYZE";
    return; // First click starts camera, second click scans
  }

  if (!faceDetected) {
    standbyText.textContent = "NO FACE DETECTED";
    standbySub.textContent = "Position subject in frame";
    addTerminalLog("WARN: No face detected — cannot capture", "warn");
    return;
  }

  if (isScanning) return;
  isScanning = true;

  // Capture frame
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

  // Build descriptor array for backend
  const descriptorArray = capturedDescriptor ? Array.from(capturedDescriptor) : null;
  const expressionData  = lastExpressions ? Object.fromEntries(
    Object.entries(lastExpressions).map(([k,v]) => [k, parseFloat(v.toFixed(4))])
  ) : null;
  const landmarkCount   = lastLandmarks ? lastLandmarks.positions.length : 0;

  // Show progress overlay
  scanProgressOverlay.style.display = "flex";
  resetSteps();

  const steps = [
    [10, "DETECTING FACE",   "Locating facial region...",        1, "active"],
    [25, "LANDMARK MAPPING", "Mapping 68 biometric points...",   2, "active"],
    [50, "FEATURE EXTRACT",  "Computing 128D descriptor...",     3, "active"],
    [75, "DATABASE LOOKUP",  "Querying criminal records...",     4, "active"],
    [90, "FINALIZING",       "Computing match scores...",        4, "done"],
    [100,"COMPLETE",         "Analysis complete.",               4, "done"],
  ];

  // Animate steps
  const stepTimings = [0, 400, 900, 1400, 1900, 2400];
  steps.forEach(([pct, title, stepText, stepNum, stepState], idx) => {
    setTimeout(() => {
      setScanProgress(pct, title, stepText);
      // Mark prev steps done
      for (let n = 1; n < stepNum; n++) setStep(n, "done");
      setStep(stepNum, stepState);
      addTerminalLog(stepText);
    }, stepTimings[idx]);
  });

  // Send to backend after 2.5s of animation
  setTimeout(async () => {
    try {
      addTerminalLog(`Sending to backend — subject: ${userId}`, "");

      const payload = {
        user_id: userId,
        image: canvas.toDataURL("image/jpeg", 0.85),
        descriptor: descriptorArray,
        expressions: expressionData,
        landmark_count: landmarkCount,
        scan_mode: scanMode,
        analysis_depth: parseInt(document.getElementById("depthSlider").value),
      };

      const res = await fetch(`${BACKEND_URL}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      scanProgressOverlay.style.display = "none";
      isScanning = false;

      if (data.error) {
        addTerminalLog("ALERT: Backend error — " + data.error, "alert");
        flashScreen("red");
        showErrorResult(data.error);
      } else {
        flashScreen("cyan");
        addTerminalLog(`Match complete — ${userId} — ${data.criminal_status}`, data.criminal_status.includes("No Record") ? "ok" : "alert");
        renderResults(userId, data, expressionData, landmarkCount);
      }

    } catch (err) {
      scanProgressOverlay.style.display = "none";
      isScanning = false;
      addTerminalLog("ALERT: Connection failed — " + err.message, "alert");
      flashScreen("red");
      showErrorResult("Backend connection failed. Is Flask running on port 8675?");
    }
  }, 2800);
}

/* ========================
   RENDER RESULTS
   ======================== */
function renderResults(userId, data, expressions, landmarkCount) {
  const isClear   = data.criminal_status.toLowerCase().includes("no record");
  const isUnknown = data.criminal_status.toLowerCase().includes("unknown") || data.criminal_status.toLowerCase().includes("not found");
  const statusClass = isClear ? "clear" : isUnknown ? "unknown" : "flagged";
  const badgeText   = isClear ? "CLEAR" : isUnknown ? "UNKNOWN" : "FLAGGED";

  // Score color class
  const scoreClass = (v) => v >= 80 ? "high" : v >= 60 ? "medium" : "low";

  // Top expressions
  const topExprs = expressions ? Object.entries(expressions).sort((a,b)=>b[1]-a[1]).slice(0,6) : [];

  resultsArea.innerHTML = `
    <!-- Subject Card -->
    <div class="subject-card">
      <div class="subject-card-header">
        <span class="subject-id">${userId.toUpperCase()}</span>
        <span class="subject-badge ${statusClass}">${badgeText}</span>
      </div>

      <div class="metric-row">
        ${buildMetric("EYE REGION MATCH",  data.eye_match,   scoreClass(data.eye_match))}
        ${buildMetric("JAW GEOMETRY",      data.jaw_match,   scoreClass(data.jaw_match))}
        ${buildMetric("NOSE CONTOUR",      data.nose_match,  scoreClass(data.nose_match))}
        ${buildMetric("FACIAL SYMMETRY",   data.symmetry,    scoreClass(data.symmetry))}
        ${buildMetric("OVERALL BIOMETRIC", data.overall,     scoreClass(data.overall))}
      </div>
    </div>

    <div class="r-divider"></div>

    <!-- Criminal Record -->
    <div class="criminal-block ${statusClass}">
      <div class="criminal-title ${statusClass}">
        <i class='bx ${isClear ? "bx-check-shield" : isUnknown ? "bx-question-mark" : "bx-error"}'></i>
        CRIMINAL RECORD
      </div>
      <div class="criminal-status">${data.criminal_status}</div>
    </div>

    <!-- Landmark Stats -->
    <div class="lmk-summary">
      <div class="lmk-title">LANDMARK ANALYSIS</div>
      <div class="lmk-stats">
        <div class="lmk-stat"><div class="lmk-stat-val">${landmarkCount || 68}</div><div class="lmk-stat-lbl">POINTS</div></div>
        <div class="lmk-stat"><div class="lmk-stat-val">128</div><div class="lmk-stat-lbl">VECTORS</div></div>
        <div class="lmk-stat"><div class="lmk-stat-val">${data.overall}%</div><div class="lmk-stat-lbl">MATCH</div></div>
      </div>
    </div>

    <!-- Expression Grid -->
    ${topExprs.length > 0 ? `
    <div class="panel-header" style="font-size:10px;margin-top:4px;"><i class='bx bx-smile'></i>EXPRESSION DATA</div>
    <div class="expr-grid">
      ${topExprs.map(([label, val]) => `
        <div class="expr-item">
          <span class="expr-label">${label.toUpperCase()}</span>
          <span class="expr-val">${(val*100).toFixed(1)}%</span>
          <div class="expr-mini-bar"><div class="expr-mini-fill" style="width:${val*100}%"></div></div>
        </div>
      `).join("")}
    </div>` : ""}
  `;

  // Animate metric bars after render
  setTimeout(() => {
    document.querySelectorAll(".metric-bar-fill").forEach(bar => {
      bar.style.width = bar.dataset.target + "%";
    });
  }, 100);
}

function buildMetric(label, value, cls) {
  return `
    <div class="metric-item">
      <div class="metric-header">
        <span class="metric-key">${label}</span>
        <span class="metric-val ${cls}">${value}%</span>
      </div>
      <div class="metric-bar-bg">
        <div class="metric-bar-fill ${cls}" data-target="${value}" style="width:0%"></div>
      </div>
    </div>
  `;
}

function showErrorResult(message) {
  resultsArea.innerHTML = `
    <div class="criminal-block flagged" style="margin-top:10px;">
      <div class="criminal-title flagged"><i class='bx bx-error-circle'></i> ERROR</div>
      <div class="criminal-status">${message}</div>
    </div>
  `;
}

/* ========================
   SCAN BTN MAIN HANDLER
   ======================== */
function initScanButton() {
  scanBtn.addEventListener("click", () => {
    if (!modelsLoaded) return;
    performScan();
  });

  stopBtn.addEventListener("click", stopCamera);
}

/* ========================
   INIT
   ======================== */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[JusticeFlowX] Facial Recognition Module booting...");

  // Visual background
  initHexCanvas();
  initDataStreams();
  initParticles();

  // UI init
  startClock();
  startTerminal();
  initModeTabs();
  initUserIdInput();
  initScanButton();

  // Wait for face-api.js to be available
  let waited = 0;
  const waitInterval = setInterval(async () => {
    waited++;
    if (typeof faceapi !== "undefined") {
      clearInterval(waitInterval);
      await loadModels();
      checkBackend();
    } else if (waited > 30) {
      clearInterval(waitInterval);
      addTerminalLog("ALERT: face-api.js failed to load", "alert");
      scanBtnText.textContent = "SCRIPT ERROR";
    }
  }, 300);
});