import re

with open('justice.js', 'r', encoding='latin-1') as f:
    content = f.read()

# I will find the block:
# /* ----------- TYPE 1: CAPTURE
# to
# /* ========================= HOVER SOUND ========================= */

start_marker = "/* ----------- TYPE 1: CAPTURE"
end_marker = "/* ========================= HOVER SOUND ========================= */"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

new_overlays = '''/* ----------- TYPE 1: CAPTURE ----------- */
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
    new_content = content[:start_idx] + new_overlays + content[end_idx:]
    with open('justice.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    print("Could not find markers.")
