with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Nav Link
nav_target = '''      <a href="modules/network_forensics/forensics_dashboard.html" class="nav-link">
        <i class='bx bx-shield-quarter'></i><span>Forensics DB</span>
      </a>'''
nav_new = '''      <a href="modules/network_forensics/forensics_dashboard.html" class="nav-link">
        <i class='bx bx-shield-quarter'></i><span>Forensics DB</span>
      </a>
      <a href="modules/chain_of_custody/index.html" class="nav-link">
        <i class='bx bx-link'></i><span>Chain of Custody</span>
      </a>'''
content = content.replace(nav_target, nav_new)

# 2. Add Scan Card
card_target = '''    <div class="scan-box" id="scanBox6">'''
new_card = '''    <div class="scan-box" id="scanBox7">
      <div class="card-glow" style="background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)"></div>
      <div class="card-corner tl"></div>
      <div class="card-corner tr"></div>
      <div class="card-corner bl"></div>
      <div class="card-corner br"></div>
      <div class="scan-line-anim"
        style="animation-delay: 8.5s; background: linear-gradient(90deg, transparent, #ffd700, transparent); box-shadow: 0 0 12px #ffd700;">
      </div>
      <div class="card-badge"
        style="color:rgba(255,215,0,0.7);border-color:rgba(255,215,0,0.2);background:rgba(255,215,0,0.05)">METHOD 07
      </div>
      <div class="icon-wrapper">
        <i class='bx bx-link' style="color:#ffd700;filter:drop-shadow(0 0 16px #ffd700)"></i>
        <div class="icon-rings">
          <div class="ring r1" style="border-color:rgba(255,215,0,0.25)"></div>
          <div class="ring r2" style="border-color:rgba(255,215,0,0.2)"></div>
          <div class="ring r3" style="border-color:rgba(255,215,0,0.15)"></div>
        </div>
      </div>
      <h2>Chain of Custody</h2>
      <p>Cryptographically secured immutable ledger for evidence tracking and handover</p>
      <div class="card-divider"></div>
      <div class="card-meta">
        <span><i class='bx bx-check-shield'></i> SHA-256 Secured</span>
      </div>
      <a href="modules/chain_of_custody/index.html" class="scan-btn" data-type="chain_of_custody" style="background: rgba(255,215,0,0.1); color: #ffd700; border-color: rgba(255,215,0,0.3)">
        <span class="btn-text">OPEN LEDGER</span>
        <span class="btn-arrow"><i class='bx bx-right-arrow-alt'></i></span>
        <div class="btn-shine"></div>
      </a>
    </div>

    <div class="scan-box" id="scanBox6">'''
content = content.replace(card_target, new_card)

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(content)


# 3. Update justice.js
with open('frontend/assets/js/justice.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Add route
js_content = js_content.replace('case "forensics_db": showForensicsDbOverlay(afterScan);   break;',
                                'case "forensics_db": showForensicsDbOverlay(afterScan);   break;\n          case "chain_of_custody": showChainOfCustodyOverlay(afterScan);   break;')

# Add overlay function
new_overlay = '''
function showChainOfCustodyOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "scan-overlay-full";
  overlay.innerHTML = 
    <div class="scan-animation-wrap">
      <div class="scan-title-overlay" style="color:#ffd700">VERIFYING IMMUTABLE LEDGER</div>
      <div style="font-size: 60px; color: #ffd700; margin: 30px auto; animation: pulse 1s infinite;"><i class='bx bx-link'></i></div>
      <div style="text-align:center;font-family:'Share Tech Mono',monospace;color:rgba(255,215,0,0.7)">
        AUTHENTICATING AGENT CREDENTIALS...
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

