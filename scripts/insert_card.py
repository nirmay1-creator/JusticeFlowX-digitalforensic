import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

nav_link = '''      <a href="modules/network/network.html" class="nav-link">
        <i class='bx bx-network-chart'></i><span>Network</span>
      </a>
      <a href="modules/network_forensics/forensics_dashboard.html" class="nav-link">
        <i class='bx bx-shield-quarter'></i><span>Forensics DB</span>
      </a>'''
content = content.replace('''      <a href="modules/network/network.html" class="nav-link">
        <i class='bx bx-network-chart'></i><span>Network</span>
      </a>''', nav_link)

new_card = '''    <div class="scan-box" id="scanBox6">
      <div class="card-glow" style="background: radial-gradient(circle, rgba(255,0,85,0.1) 0%, transparent 70%)"></div>
      <div class="card-corner tl"></div>
      <div class="card-corner tr"></div>
      <div class="card-corner bl"></div>
      <div class="card-corner br"></div>
      <div class="scan-line-anim"
        style="animation-delay: 7.5s; background: linear-gradient(90deg, transparent, #ff0055, transparent); box-shadow: 0 0 12px #ff0055;">
      </div>
      <div class="card-badge"
        style="color:rgba(255,0,85,0.7);border-color:rgba(255,0,85,0.2);background:rgba(255,0,85,0.05)">METHOD 06
      </div>
      <div class="icon-wrapper">
        <i class='bx bx-radar' style="color:#ff0055;filter:drop-shadow(0 0 16px #ff0055)"></i>
        <div class="icon-rings">
          <div class="ring r1" style="border-color:rgba(255,0,85,0.25)"></div>
          <div class="ring r2" style="border-color:rgba(255,0,85,0.2)"></div>
          <div class="ring r3" style="border-color:rgba(255,0,85,0.15)"></div>
        </div>
      </div>
      <h2>Network Forensics Module</h2>
      <p>Advanced real-time packet inspection, threat intelligence, and AI-driven analysis</p>
      <div class="card-divider"></div>
      <div class="card-meta">
        <span><i class='bx bx-check-shield'></i> DPI Active</span>
        <a href="modules/network_forensics/forensics_dashboard.html" class="scan-btn" data-type="forensics_db" style="background: rgba(255,0,85,0.1); color: #ff0055; border-color: rgba(255,0,85,0.3)">
          LAUNCH MODULE <i class='bx bx-right-arrow-alt'></i>
        </a>
      </div>
    </div>
  </div>'''

content = re.sub(r'    </div>\s*</div>\s*<!-- TERMINAL COMPONENT -->', new_card + '\n\n  <!-- TERMINAL COMPONENT -->', content)

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
