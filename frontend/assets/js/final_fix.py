import re

with open('justice.js', 'r', encoding='latin-1') as f:
    content = f.read()

# 1. Replace the overlays block
start_marker = "/* ========================= SCAN OVERLAYS"
end_marker = "/* ========================= BOOT SEQUENCE ========================= */"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

new_overlays = '''/* ========================= SCAN OVERLAYS ========================= */

/* ----------- TYPE 1: CAPTURE ----------- */
function showCaptureOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "module-loader";
  overlay.innerHTML = 
    <div class="loader-radar"></div>
    <div class="loader-title" style="color: var(--cyan)">INITIALIZING SNIFFER...</div>
  ;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => { overlay.remove(); onComplete(); }, 500);
  }, 1200);
}

/* ----------- TYPE 2: ANALYZER ----------- */
function showAnalyzerOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "module-loader";
  overlay.innerHTML = 
    <div class="loader-hex">
      <span>0x4A</span><span>0x55</span><span>0x53</span><span>0x54</span>
    </div>
    <div class="loader-title" style="color: var(--green)">DECRYPTING PCAP STREAM...</div>
  ;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => { overlay.remove(); onComplete(); }, 500);
  }, 1200);
}

/* ----------- TYPE 3: TRAFFIC ----------- */
function showTrafficOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "module-loader";
  overlay.innerHTML = 
    <div class="loader-topology">
      <div class="node"></div><div class="line"></div><div class="node"></div><div class="line"></div><div class="node"></div>
    </div>
    <div class="loader-title" style="color: #ff9f43">BUILDING TOPOLOGY...</div>
  ;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => { overlay.remove(); onComplete(); }, 500);
  }, 1200);
}

/* ----------- TYPE 4: THREAT ----------- */
function showThreatOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "module-loader";
  overlay.innerHTML = 
    <div class="loader-threat"></div>
    <div class="loader-title" style="color: #00bfff">QUERYING THREAT FEEDS...</div>
  ;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => { overlay.remove(); onComplete(); }, 500);
  }, 1200);
}

'''

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_overlays + content[end_idx:]

# 2. Add initNavLinks and fix DOMContentLoaded
nav_links_and_init = '''
/* ========================= NAV LINKS ROUTING ========================= */
function initNavLinks() {
  document.querySelectorAll(".nav-link, .dropdown a").forEach(link => {
    link.addEventListener("click", e => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || link.id === "logoutBtn") return;
      if (link.classList.contains("active")) return;

      e.preventDefault();

      function navigate() { window.location.href = href; }

      if (href.includes("live_capture.html")) showCaptureOverlay(navigate);
      else if (href.includes("packet_analyzer.html")) showAnalyzerOverlay(navigate);
      else if (href.includes("threat_intel.html")) showThreatOverlay(navigate);
      else if (href.includes("forensics.html")) showTrafficOverlay(navigate);
      else if (href.includes("index.html")) navigate(); // Dashboard has boot sequence on load
      else navigate();
    });
  });
}

/* ========================= MAIN INIT ========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("[JusticeFlowX] DOM Ready - Launching boot sequence");
  initHexCanvas();
  initDataStreams();
  initParticles();

  function onSystemReady() {
    startClock();
    startCpuMeter();
    startMarquee();
    initBrandGlitch();
    initHoverSound();
    initScanButtons();
    initMenu();
    initLogout();
    initNavLinks();
    if(typeof startTerminal === 'function') startTerminal();
    if(typeof animateStats === 'function') animateStats();
    console.log("[JusticeFlowX] All systems online.");
  }

  if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
    runBootSequence(onSystemReady);
  } else {
    onSystemReady();
  }
});
'''

# Find the start of the original MAIN INIT
main_init_marker = "/* ========================= MAIN INIT ========================= */"
main_init_idx = content.find(main_init_marker)
if main_init_idx != -1:
    content = content[:main_init_idx] + nav_links_and_init

with open('justice.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fix completed.")
