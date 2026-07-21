import re

with open('justice.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find the exact markers using regex
# We want to replace everything from "TYPE 1: FINGERPRINT" up to "BOOT SEQUENCE"
match = re.search(r'/\* ----------- TYPE 1: FINGERPRINT.*?/\* ========================= BOOT SEQUENCE', content, re.DOTALL)
if match:
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

/* ========================= BOOT SEQUENCE'''

    new_content = content[:match.start()] + new_overlays + content[match.end()-40:]
    # Wait, the match.end() goes up to the end of BOOT SEQUENCE. Let's just use re.sub.
    new_content = re.sub(r'/\* ----------- TYPE 1: FINGERPRINT.*?/\* ========================= BOOT SEQUENCE', new_overlays, content, flags=re.DOTALL)
    
    with open('justice.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced overlays successfully.")
else:
    print("Failed to find overlay block.")

# Wait! The main init and nav links were already added by final_fix.py because main init marker WAS found!
# However, my final_fix.py used showCaptureOverlay, etc. which didn't exist!
# And since they didn't exist, when the user clicked a button, the fallback showFingerprintOverlay was called, or initScanButtons called showCaptureOverlay which threw an error!
# Let's check initScanButtons in the current file to see what it calls.
