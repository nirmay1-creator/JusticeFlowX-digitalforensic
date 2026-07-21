import re

with open('frontend/assets/css/justice.css', 'a', encoding='utf-8') as f:
    f.write('''

/* ========================= NETWORK FORENSICS OVERLAY ========================= */
.loader-radar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px solid rgba(255,0,85,0.2);
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 0 30px rgba(255,0,85,0.2);
}
.loader-radar::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  background: conic-gradient(from 0deg, transparent 70%, rgba(255,0,85,0.8) 100%);
  transform-origin: 0 0;
  animation: radarSpin 1.5s linear infinite;
}
@keyframes radarSpin {
  100% { transform: rotate(360deg); }
}
''')

with open('frontend/assets/js/justice.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Update initScanButtons
js_content = js_content.replace('case "network":  showNetworkOverlay(afterScan);     break;',
                                'case "network":  showNetworkOverlay(afterScan);     break;\n          case "forensics_db": showForensicsDbOverlay(afterScan);   break;')

new_overlay = '''
function showForensicsDbOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "scan-overlay-full";
  overlay.innerHTML = 
    <div class="scan-animation-wrap">
      <div class="scan-title-overlay" style="color:#ff0055">INITIALIZING DEEP PACKET INSPECTION</div>
      <div class="loader-radar" style="margin: 30px auto;"></div>
      <div style="text-align:center;font-family:'Share Tech Mono',monospace;color:rgba(255,0,85,0.7)">
        ESTABLISHING FORENSIC UPLINK...
      </div>
    </div>
  ;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add("show"), 50);
  setTimeout(() => overlay.classList.remove("show"), 2800);
  setTimeout(() => { overlay.remove(); onComplete(); }, 3200);
}
'''
js_content = js_content.replace('function initScanButtons() {', new_overlay + '\nfunction initScanButtons() {')

with open('frontend/assets/js/justice.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
