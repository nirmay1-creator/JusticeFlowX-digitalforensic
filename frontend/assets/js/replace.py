import re

with open('justice.js', 'r', encoding='latin-1') as f:
    content = f.read()

# Replace showCaptureOverlay
content = re.sub(
    r'function showCaptureOverlay\(onComplete\)\s*\{[\s\S]*?requestAnimationFrame\(updateProgress\);\s*\}',
    '''function showCaptureOverlay(onComplete) {
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
}''',
    content
)

# Replace showAnalyzerOverlay
content = re.sub(
    r'function showAnalyzerOverlay\(onComplete\)\s*\{[\s\S]*?requestAnimationFrame\(updateProgress\);\s*\}',
    '''function showAnalyzerOverlay(onComplete) {
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
}''',
    content
)

# Replace showTrafficOverlay
content = re.sub(
    r'function showTrafficOverlay\(onComplete\)\s*\{[\s\S]*?requestAnimationFrame\(updateProgress\);\s*\}',
    '''function showTrafficOverlay(onComplete) {
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
}''',
    content
)

# Replace showThreatOverlay
content = re.sub(
    r'function showThreatOverlay\(onComplete\)\s*\{[\s\S]*?requestAnimationFrame\(updateProgress\);\s*\}',
    '''function showThreatOverlay(onComplete) {
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
}''',
    content
)

with open('justice.js', 'w', encoding='latin-1') as f:
    f.write(content)
