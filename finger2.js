/* ================================================================
   JusticeFlowX — finger2.js
   Fingerprint Verification Module
   - WebAuthn hardware fingerprint reader support
   - Local fallback database
   - Python backend API support (see backend_server.py)
   ================================================================ */

/* ----------------------------------------------------------------
   CONFIG
   ---------------------------------------------------------------- */
const CONFIG = {
  BACKEND_URL: "http://localhost:5000",   // Python backend (optional)
  USE_BACKEND: false,                      // set true if backend is running
  SCAN_DURATION_MS: 3000,
  WEBAUTHN_TIMEOUT: 60000,
};

/* ----------------------------------------------------------------
   LOCAL FINGERPRINT DATABASE
   ---------------------------------------------------------------- */
const FINGERPRINT_DB = {
  "FP1001": { name: "Rahul Sharma",   criminal: true,  case: "Robbery Case 2023",    confidence: 98.4 },
  "FP1002": { name: "Amit Verma",     criminal: false,                                confidence: 99.1 },
  "FP1003": { name: "Sneha Patil",    criminal: false,                                confidence: 97.8 },
  "FP1004": { name: "Rakesh Mehta",   criminal: true,  case: "Fraud Case 2022",       confidence: 96.2 },
  "FP1005": { name: "Pooja Desai",    criminal: false,                                confidence: 99.4 },
  "FP1006": { name: "Vikram Nair",    criminal: true,  case: "Assault Case 2021",     confidence: 95.7 },
  "FP1007": { name: "Anjali Singh",   criminal: false,                                confidence: 98.9 },
  "FP1008": { name: "Deepak Gupta",   criminal: true,  case: "Cybercrime Case 2024",  confidence: 97.3 },
};

/* ----------------------------------------------------------------
   DOM REFS
   ---------------------------------------------------------------- */
const dom = {
  scannerFrame:  () => document.getElementById("scannerFrame"),
  fpSweep:       () => document.getElementById("fpSweep"),
  fpGlow:        () => document.getElementById("fpGlow"),
  ringFill:      () => document.getElementById("ringFill"),
  ssText:        () => document.getElementById("ssText"),
  scanLog:       () => document.getElementById("scanLog"),
  resultCard:    () => document.getElementById("resultCard"),
  rcIdle:        () => document.getElementById("rcIdle"),
  rcData:        () => document.getElementById("rcData"),
  rcBanner:      () => document.getElementById("rcBanner"),
  rcBannerIcon:  () => document.getElementById("rcBannerIcon"),
  rcBannerText:  () => document.getElementById("rcBannerText"),
  rcName:        () => document.getElementById("rcName"),
  rcFpId:        () => document.getElementById("rcFpId"),
  rcCriminal:    () => document.getElementById("rcCriminal"),
  rcCaseRow:     () => document.getElementById("rcCaseRow"),
  rcCase:        () => document.getElementById("rcCase"),
  confBar:       () => document.getElementById("confBar"),
  confVal:       () => document.getElementById("confVal"),
  rcScanTime:    () => document.getElementById("rcScanTime"),
  rcTimestamp:   () => document.getElementById("rcTimestamp"),
  threatBox:     () => document.getElementById("threatBox"),
  threatLevel:   () => document.getElementById("threatLevel"),
  threatBar:     () => document.getElementById("threatBar"),
  cpuVal:        () => document.getElementById("cpuVal"),
  clockDisplay:  () => document.getElementById("clockDisplay"),
  statusDot:     () => document.getElementById("statusDot"),
  systemStatus:  () => document.getElementById("systemStatus"),
  inputSuffix:   () => document.getElementById("inputStatus"),
  fingerId:      () => document.getElementById("fingerId"),
  logTime:       () => document.getElementById("logTime"),
  scanBtn:       () => document.getElementById("scanBtn"),
  webauthnBtn:   () => document.getElementById("webauthnBtn"),
};

/* ----------------------------------------------------------------
   STATE
   ---------------------------------------------------------------- */
let isScanning = false;

/* ----------------------------------------------------------------
   CLOCK
   ---------------------------------------------------------------- */
function startClock() {
  const tick = () => {
    const now = new Date();
    const el = dom.clockDisplay();
    if (el) el.textContent = now.toTimeString().slice(0, 8);
    const lt = dom.logTime();
    if (lt) lt.textContent = now.toTimeString().slice(0, 8);
  };
  tick();
  setInterval(tick, 1000);
}

/* ----------------------------------------------------------------
   CPU METER
   ---------------------------------------------------------------- */
function startCpuMeter() {
  let base = 32;
  setInterval(() => {
    base = Math.max(10, Math.min(88, base + (Math.random() - 0.5) * 12));
    const el = dom.cpuVal();
    if (!el) return;
    const v = Math.round(base);
    el.textContent = v + "%";
    el.style.color = v > 70 ? "var(--red)" : v > 50 ? "var(--warn)" : "var(--green)";
  }, 1800);
}

/* ----------------------------------------------------------------
   HEX CANVAS BACKGROUND
   ---------------------------------------------------------------- */
function initHexCanvas() {
  const canvas = document.getElementById("hexCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);

  const hexSize = 36;
  const cols = Math.ceil(window.innerWidth / (hexSize * 1.75)) + 2;
  const rows = Math.ceil(window.innerHeight / (hexSize * 1.55)) + 2;

  const hexagons = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      hexagons.push({
        x: c * hexSize * 1.75 + (r % 2 === 0 ? 0 : hexSize * 0.875),
        y: r * hexSize * 1.55,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.002 + Math.random() * 0.004,
        activated: false, activationTimer: 0,
      });
    }
  }

  setInterval(() => {
    const h = hexagons[Math.floor(Math.random() * hexagons.length)];
    if (!h.activated) { h.activated = true; h.activationTimer = 60; }
  }, 200);

  function drawHex(x, y, size, alpha, bright) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      i === 0 ? ctx.moveTo(x + size * Math.cos(a), y + size * Math.sin(a))
              : ctx.lineTo(x + size * Math.cos(a), y + size * Math.sin(a));
    }
    ctx.closePath();
    ctx.strokeStyle = bright ? `rgba(0,245,255,${alpha * 3})` : `rgba(0,180,200,${alpha})`;
    ctx.lineWidth = bright ? 1.2 : 0.6;
    ctx.stroke();
  }

  (function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexagons.forEach(h => {
      h.pulsePhase += h.pulseSpeed;
      const pulse = 0.04 + Math.sin(h.pulsePhase) * 0.035;
      if (h.activated) {
        h.activationTimer--;
        if (h.activationTimer <= 0) h.activated = false;
        drawHex(h.x, h.y, hexSize - 2, pulse * 4, true);
      } else {
        drawHex(h.x, h.y, hexSize - 2, pulse, false);
      }
    });
    requestAnimationFrame(animate);
  })();
}

/* ----------------------------------------------------------------
   DATA STREAMS
   ---------------------------------------------------------------- */
function initDataStreams() {
  const container = document.getElementById("dataStreams");
  if (!container) return;
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("div");
    s.className = "data-stream";
    s.style.left = Math.random() * 100 + "vw";
    s.style.animationDuration = (7 + Math.random() * 14) + "s";
    s.style.animationDelay = (Math.random() * 12) + "s";
    s.style.height = (80 + Math.random() * 180) + "px";
    container.appendChild(s);
  }
}

/* ----------------------------------------------------------------
   PARTICLES
   ---------------------------------------------------------------- */
function initParticles() {
  const colors = ["#00f5ff", "#7b2fff", "#00ff88"];
  for (let i = 0; i < 35; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = 1.5 + Math.random() * 3;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}vw;bottom:-10px;
      animation-duration:${12+Math.random()*18}s;animation-delay:${Math.random()*16}s;
      background:${colors[~~(Math.random()*colors.length)]};`;
    document.body.appendChild(p);
  }
}

/* ----------------------------------------------------------------
   STAT COUNTER ANIMATION
   ---------------------------------------------------------------- */
function animateStats() {
  document.querySelectorAll(".ms-val").forEach(el => {
    const target = parseFloat(el.getAttribute("data-count"));
    const isDecimal = target % 1 !== 0;
    const start = performance.now();
    const duration = 1800;
    (function update(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = isDecimal ? (target * ease).toFixed(1) : Math.round(target * ease);
      if (t < 1) requestAnimationFrame(update);
    })(start);
  });
}

/* ----------------------------------------------------------------
   SCAN LOG HELPER
   ---------------------------------------------------------------- */
function addLog(text, type = "") {
  const body = dom.scanLog();
  if (!body) return;
  const div = document.createElement("div");
  div.className = "log-line" + (type ? " " + type : "");
  div.textContent = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  // Keep max 20 lines
  while (body.children.length > 20) body.removeChild(body.firstChild);
}

/* ----------------------------------------------------------------
   INPUT LIVE FEEDBACK
   ---------------------------------------------------------------- */
function initInputFeedback() {
  const input = dom.fingerId();
  const suffix = dom.inputSuffix();
  if (!input || !suffix) return;

  input.addEventListener("input", () => {
    const val = input.value.trim();
    const fullId = "FP" + val;
    if (!val) {
      suffix.innerHTML = "<i class='bx bx-circle'></i>";
      suffix.className = "input-suffix";
    } else if (FINGERPRINT_DB[fullId]) {
      suffix.innerHTML = "<i class='bx bx-check'></i>";
      suffix.className = "input-suffix active";
    } else {
      suffix.innerHTML = "<i class='bx bx-x'></i>";
      suffix.className = "input-suffix error";
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startScan();
  });
}

/* ----------------------------------------------------------------
   SET SCANNER STATE
   ---------------------------------------------------------------- */
function setScannerState(state) {
  const frame = dom.scannerFrame();
  const ssText = dom.ssText();
  const statusDot = dom.statusDot();
  const systemStatus = dom.systemStatus();

  if (!frame) return;
  frame.className = "scanner-frame" + (state !== "idle" ? " " + state : "");
  if (ssText) {
    ssText.className = "ss-text " + state;
    const labels = {
      idle: "READY FOR SCAN",
      scanning: "SCANNING...",
      success: "MATCH CONFIRMED",
      failure: "NO MATCH FOUND",
    };
    ssText.textContent = labels[state] || "READY";
  }

  if (statusDot && systemStatus) {
    if (state === "scanning") {
      statusDot.style.background = "var(--warn)";
      statusDot.style.boxShadow = "0 0 8px var(--warn)";
      systemStatus.textContent = "SCANNING...";
      systemStatus.style.color = "var(--warn)";
    } else if (state === "success") {
      statusDot.style.background = "var(--green)";
      statusDot.style.boxShadow = "0 0 8px var(--green)";
      systemStatus.textContent = "VERIFIED";
      systemStatus.style.color = "var(--green)";
    } else if (state === "failure") {
      statusDot.style.background = "var(--red)";
      statusDot.style.boxShadow = "0 0 8px var(--red)";
      systemStatus.textContent = "ACCESS DENIED";
      systemStatus.style.color = "var(--red)";
    } else {
      statusDot.style.background = "var(--green)";
      statusDot.style.boxShadow = "0 0 8px var(--green)";
      systemStatus.textContent = "BIOMETRIC READY";
      systemStatus.style.color = "var(--green)";
    }
  }
}

/* ----------------------------------------------------------------
   ANIMATE RING PROGRESS
   ---------------------------------------------------------------- */
function animateRing(progressFraction) {
  const ring = dom.ringFill();
  if (!ring) return;
  const circumference = 754;
  ring.style.strokeDashoffset = circumference * (1 - progressFraction);
}

/* ----------------------------------------------------------------
   SHOW RESULTS
   ---------------------------------------------------------------- */
function showResults(id, record) {
  const rcIdle = dom.rcIdle();
  const rcData = dom.rcData();
  if (rcIdle) rcIdle.style.display = "none";
  if (rcData) rcData.style.display = "block";

  // Banner
  const banner = dom.rcBanner();
  const bannerIcon = dom.rcBannerIcon();
  const bannerText = dom.rcBannerText();
  if (banner) {
    banner.className = "rc-status-banner " + (record.criminal ? "err" : "ok");
  }
  if (bannerIcon) {
    bannerIcon.className = record.criminal ? "bx bx-x-circle" : "bx bx-check-circle";
  }
  if (bannerText) {
    bannerText.textContent = record.criminal ? "CRIMINAL RECORD FOUND" : "IDENTITY VERIFIED";
  }

  // Fields
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("rcName", record.name);
  set("rcFpId", "FP" + id);
  set("rcCriminal", record.criminal ? "⚠ YES — RECORD EXISTS" : "✓ CLEAR — NO RECORD");
  document.getElementById("rcCriminal").style.color = record.criminal ? "var(--red)" : "var(--green)";

  const caseRow = dom.rcCaseRow();
  if (caseRow) caseRow.style.display = record.criminal ? "flex" : "none";
  if (record.criminal) set("rcCase", record.case || "N/A");

  // Confidence bar
  const conf = record.confidence || 97.5;
  const confBar = dom.confBar();
  const confVal = dom.confVal();
  if (confBar) { confBar.style.setProperty("--conf", conf + "%"); }
  if (confVal) confVal.textContent = conf + "%";

  // Times
  const scanTime = (CONFIG.SCAN_DURATION_MS / 1000).toFixed(1) + "s";
  set("rcScanTime", scanTime);
  set("rcTimestamp", new Date().toLocaleString("en-IN", { hour12: false }));

  // Threat box
  const threatBox = dom.threatBox();
  const threatLevel = dom.threatLevel();
  const threatBar = dom.threatBar();
  if (threatBox) threatBox.style.display = "block";

  if (record.criminal) {
    const level = "HIGH";
    if (threatLevel) { threatLevel.textContent = level; threatLevel.className = "threat-level HIGH"; }
    if (threatBar) { threatBar.style.cssText = "width:80%;background:var(--red);box-shadow:0 0 8px var(--red);"; }
    setTimeout(() => { if (threatBar) threatBar.style.width = "80%"; }, 100);
  } else {
    if (threatLevel) { threatLevel.textContent = "LOW"; threatLevel.className = "threat-level LOW"; }
    if (threatBar) { threatBar.style.cssText = "width:15%;background:var(--green);box-shadow:0 0 8px var(--green);"; }
  }
}

function showNoRecord(id) {
  const rcIdle = dom.rcIdle();
  const rcData = dom.rcData();
  if (rcIdle) rcIdle.style.display = "none";
  if (rcData) rcData.style.display = "block";

  const banner = dom.rcBanner();
  if (banner) banner.className = "rc-status-banner err";
  const bannerIcon = dom.rcBannerIcon();
  if (bannerIcon) bannerIcon.className = "bx bx-error-circle";
  const bannerText = dom.rcBannerText();
  if (bannerText) bannerText.textContent = "NO RECORD FOUND";

  document.getElementById("rcName").textContent = "Unknown Identity";
  document.getElementById("rcFpId").textContent = "FP" + id;
  document.getElementById("rcCriminal").textContent = "— NOT IN DATABASE —";
  document.getElementById("rcCriminal").style.color = "var(--warn)";
  document.getElementById("rcCaseRow").style.display = "none";
  document.getElementById("confBar").style.setProperty("--conf", "0%");
  document.getElementById("confVal").textContent = "0%";
  document.getElementById("rcScanTime").textContent = (CONFIG.SCAN_DURATION_MS / 1000).toFixed(1) + "s";
  document.getElementById("rcTimestamp").textContent = new Date().toLocaleString("en-IN", { hour12: false });

  const threatBox = dom.threatBox();
  if (threatBox) threatBox.style.display = "none";
}

/* ----------------------------------------------------------------
   RESET UI
   ---------------------------------------------------------------- */
function resetUI() {
  setScannerState("idle");
  animateRing(0);
  const rcIdle = dom.rcIdle();
  const rcData = dom.rcData();
  if (rcIdle) rcIdle.style.display = "flex";
  if (rcData) rcData.style.display = "none";
  const threatBox = dom.threatBox();
  if (threatBox) threatBox.style.display = "none";
  const scanBtn = dom.scanBtn();
  const webauthnBtn = dom.webauthnBtn();
  if (scanBtn) scanBtn.disabled = false;
  if (webauthnBtn) webauthnBtn.disabled = false;
  isScanning = false;
}

/* ----------------------------------------------------------------
   MAIN SCAN FUNCTION (ID-based)
   ---------------------------------------------------------------- */
async function startScan() {
  if (isScanning) return;

  const rawId = (dom.fingerId().value || "").trim();
  // Accept bare numbers like "1001" or full "FP1001"
  const id = rawId.toUpperCase().startsWith("FP") ? rawId.replace(/^FP/i, "") : rawId;

  if (!id) {
    addLog("ERROR: No Fingerprint ID entered", "err");
    shakeInput();
    return;
  }

  isScanning = true;
  const scanBtn = dom.scanBtn();
  const webauthnBtn = dom.webauthnBtn();
  if (scanBtn) scanBtn.disabled = true;
  if (webauthnBtn) webauthnBtn.disabled = true;

  // Begin scan UI
  setScannerState("scanning");
  animateRing(0);
  addLog("Initiating biometric scan for FP" + id + "...");
  addLog("Encrypting biometric payload...");

  const scanStart = Date.now();

  // Animate ring over scan duration
  let progress = 0;
  const ringInterval = setInterval(() => {
    progress = Math.min(progress + (100 / (CONFIG.SCAN_DURATION_MS / 40)), 100);
    animateRing(progress / 100);
    if (progress >= 100) clearInterval(ringInterval);
  }, 40);

  // Log messages timed
  setTimeout(() => addLog("Ridge pattern analysis in progress..."), 600);
  setTimeout(() => addLog("Cross-referencing criminal database [14,217]..."), 1400);
  setTimeout(() => addLog("Verifying match confidence..."), 2000);

  // Fetch from backend or local DB
  let record = null;
  let notFound = false;

  if (CONFIG.USE_BACKEND) {
    try {
      addLog("Querying backend API...");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/fingerprint/${id}`);
      if (res.ok) {
        const data = await res.json();
        record = data.record || null;
        if (!data.found) notFound = true;
      } else {
        throw new Error("Backend returned " + res.status);
      }
    } catch (err) {
      addLog("Backend unavailable — falling back to local DB", "warn");
      record = FINGERPRINT_DB["FP" + id] || null;
      if (!record) notFound = true;
    }
  } else {
    record = FINGERPRINT_DB["FP" + id] || null;
    if (!record) notFound = true;
  }

  // Wait for full scan duration
  const elapsed = Date.now() - scanStart;
  const remaining = Math.max(0, CONFIG.SCAN_DURATION_MS - elapsed);
  await sleep(remaining);

  clearInterval(ringInterval);
  animateRing(1);

  if (notFound || !record) {
    setScannerState("failure");
    addLog("No match found in database", "err");
    addLog("SCAN COMPLETE — IDENTITY UNKNOWN", "warn");
    showNoRecord(id);
  } else {
    setScannerState("success");
    addLog("Match confirmed: " + record.name, "ok");
    addLog(record.criminal ? "⚠ CRIMINAL RECORD DETECTED" : "✓ No criminal record found", record.criminal ? "err" : "ok");
    addLog("SCAN COMPLETE — " + (record.criminal ? "FLAGGED" : "CLEARED"), record.criminal ? "err" : "ok");
    showResults(id, record);
  }

  if (scanBtn) scanBtn.disabled = false;
  if (webauthnBtn) webauthnBtn.disabled = false;
  isScanning = false;
}

/* ----------------------------------------------------------------
   WEBAUTHN HARDWARE READER
   ---------------------------------------------------------------- */
async function startWebAuthn() {
  if (isScanning) return;
  isScanning = true;

  const scanBtn = dom.scanBtn();
  const webauthnBtn = dom.webauthnBtn();
  if (scanBtn) scanBtn.disabled = true;
  if (webauthnBtn) webauthnBtn.disabled = true;

  if (!window.PublicKeyCredential) {
    addLog("ERROR: WebAuthn not supported in this browser", "err");
    resetUI();
    return;
  }

  setScannerState("scanning");
  animateRing(0);
  addLog("Initializing hardware biometric reader...");
  addLog("Requesting platform authenticator...");

  // Animate ring
  let progress = 0;
  const ringInterval = setInterval(() => {
    progress = Math.min(progress + 1, 90);
    animateRing(progress / 100);
    if (progress >= 90) clearInterval(ringInterval);
  }, 100);

  try {
    // Check platform authenticator availability
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    if (!available) {
      addLog("No platform authenticator found", "warn");
      addLog("Simulating hardware scan (demo mode)...");
      clearInterval(ringInterval);
      await sleep(2000);
      animateRing(1);
      setScannerState("success");
      addLog("Demo scan complete — FP1002 simulated", "ok");
      const demoRecord = FINGERPRINT_DB["FP1002"];
      showResults("1002", demoRecord);
      clearInterval(ringInterval);
      isScanning = false;
      if (scanBtn) scanBtn.disabled = false;
      if (webauthnBtn) webauthnBtn.disabled = false;
      return;
    }

    addLog("Platform authenticator available", "ok");
    addLog("Waiting for fingerprint input...");

    // Create challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions = {
      challenge,
      rp: { name: "JusticeFlowX", id: window.location.hostname || "localhost" },
      user: {
        id: new Uint8Array(16),
        name: "officer@justicefx",
        displayName: "JusticeFlowX Officer",
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: CONFIG.WEBAUTHN_TIMEOUT,
    };

    const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });

    clearInterval(ringInterval);
    animateRing(1);

    if (credential) {
      addLog("Fingerprint verified by hardware reader", "ok");
      addLog("Mapping to database entry...");
      await sleep(600);

      // In a real system, the credential ID maps to a database record.
      // Here we simulate with a random clear record for demo.
      const demoKeys = Object.keys(FINGERPRINT_DB).filter(k => !FINGERPRINT_DB[k].criminal);
      const demoId = demoKeys[Math.floor(Math.random() * demoKeys.length)];
      const numericId = demoId.replace("FP", "");

      setScannerState("success");
      addLog("Match confirmed: " + FINGERPRINT_DB[demoId].name, "ok");
      addLog("SCAN COMPLETE — CLEARED", "ok");
      showResults(numericId, FINGERPRINT_DB[demoId]);
    }
  } catch (err) {
    clearInterval(ringInterval);
    if (err.name === "NotAllowedError") {
      addLog("Fingerprint scan cancelled by user", "warn");
      setScannerState("idle");
      animateRing(0);
    } else if (err.name === "InvalidStateError") {
      addLog("Credential already registered — trying authentication...", "warn");
      await tryWebAuthnAuth(ringInterval);
      return;
    } else {
      addLog("ERROR: " + err.message, "err");
      setScannerState("failure");
    }
  }

  if (scanBtn) scanBtn.disabled = false;
  if (webauthnBtn) webauthnBtn.disabled = false;
  isScanning = false;
}

/* WebAuthn Authentication (for already-registered credentials) */
async function tryWebAuthnAuth(ringInterval) {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: "required",
        timeout: CONFIG.WEBAUTHN_TIMEOUT,
      }
    });
    if (assertion) {
      clearInterval(ringInterval);
      animateRing(1);
      addLog("Authentication successful", "ok");
      setScannerState("success");
      const demoRecord = FINGERPRINT_DB["FP1005"];
      showResults("1005", demoRecord);
    }
  } catch (e) {
    clearInterval(ringInterval);
    addLog("Authentication failed: " + e.message, "err");
    setScannerState("failure");
  } finally {
    isScanning = false;
    const sb = dom.scanBtn(); const wb = dom.webauthnBtn();
    if (sb) sb.disabled = false;
    if (wb) wb.disabled = false;
  }
}

/* ----------------------------------------------------------------
   SHAKE INPUT ANIMATION
   ---------------------------------------------------------------- */
function shakeInput() {
  const wrapper = document.querySelector(".input-wrapper");
  if (!wrapper) return;
  wrapper.style.animation = "none";
  wrapper.style.borderColor = "var(--red)";
  wrapper.style.boxShadow = "0 0 16px rgba(255,43,94,0.3)";
  const keyframes = [
    { transform: "translateX(0)" },
    { transform: "translateX(-6px)" },
    { transform: "translateX(6px)" },
    { transform: "translateX(-4px)" },
    { transform: "translateX(4px)" },
    { transform: "translateX(0)" },
  ];
  wrapper.animate(keyframes, { duration: 400, easing: "ease" }).onfinish = () => {
    wrapper.style.borderColor = "";
    wrapper.style.boxShadow = "";
  };
}

/* ----------------------------------------------------------------
   SLEEP UTILITY
   ---------------------------------------------------------------- */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ----------------------------------------------------------------
   INIT
   ---------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  console.log("[JusticeFlowX] finger2.js — Biometric Module Loading");

  initHexCanvas();
  initDataStreams();
  initParticles();
  startClock();
  startCpuMeter();
  initInputFeedback();
  animateStats();

  // Expose scan functions globally (called from HTML onclick)
  window.startScan = startScan;
  window.startWebAuthn = startWebAuthn;

  addLog("Biometric module initialized", "ok");
  addLog("WebAuthn: " + (window.PublicKeyCredential ? "supported" : "unavailable"), window.PublicKeyCredential ? "ok" : "warn");
  addLog("Backend: " + (CONFIG.USE_BACKEND ? "enabled" : "local DB mode"));
  addLog("Awaiting fingerprint input...");

  console.log("[JusticeFlowX] Biometric module ready.");
});