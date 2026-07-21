import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I will just write a very clean replacement of the scan-grid innerHTML to fix all the duplication issues I caused earlier.
# This will restore the grid perfectly.
grid_content = '''
    <div class="scan-box" id="scanBox1">
      <div class="card-glow"></div>
      <div class="card-corner tl"></div><div class="card-corner tr"></div>
      <div class="card-corner bl"></div><div class="card-corner br"></div>
      <div class="method-tag">METHOD 01</div>
      <div class="icon-wrap">
        <i class='bx bx-scan'></i>
        <div class="icon-rings">
          <div class="ring r1"></div>
          <div class="ring r2"></div>
          <div class="ring r3" style="border-style:dashed"></div>
        </div>
      </div>
      <h2>Facial Recognition</h2>
      <p>Align face with sensor grid for AI-powered facial geometry verification</p>
      <div class="card-divider"></div>
      <div class="card-meta">
        <span><i class='bx bx-target-lock'></i> 118-point Map</span>
        <span><i class='bx bx-time-five'></i> ~0.8s Response</span>
      </div>
      <a href="#" class="scan-btn">
        <span class="btn-text">INITIATE SCAN</span>
        <span class="btn-arrow"><i class='bx bx-right-arrow-alt'></i></span>
        <div class="btn-shine"></div>
      </a>
    </div>

    <div class="scan-box" id="scanBox2">
      <div class="card-glow" style="background: radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)"></div>
      <div class="card-corner tl"></div><div class="card-corner tr"></div>
      <div class="card-corner bl"></div><div class="card-corner br"></div>
      <div class="method-tag" style="color:var(--green); border-color:var(--green)">METHOD 02</div>
      <div class="icon-wrap">
        <i class='bx bx-fingerprint' style="color:var(--green); filter:drop-shadow(0 0 10px var(--green))"></i>
        <div class="icon-rings">
          <div class="ring r1" style="border-color:rgba(0,255,136,0.3)"></div>
          <div class="ring r2" style="border-color:rgba(0,255,136,0.2)"></div>
        </div>
      </div>
      <h2>Biometric Hash</h2>
      <p>Extract unique latent markers against global federal fingerprint database</p>
      <div class="card-divider"></div>
      <div class="card-meta">
        <span><i class='bx bx-shield-quarter'></i> NIST Level 4</span>
      </div>
      <a href="#" class="scan-btn" style="background: rgba(0,255,136,0.05); color: var(--green); border-color: rgba(0,255,136,0.3)">
        <span class="btn-text">EXTRACT</span>
        <span class="btn-arrow"><i class='bx bx-right-arrow-alt'></i></span>
        <div class="btn-shine"></div>
      </a>
    </div>

    <div class="scan-box" id="scanBox3">
      <div class="card-glow" style="background: radial-gradient(circle, rgba(255,170,0,0.1) 0%, transparent 70%)"></div>
      <div class="card-corner tl"></div><div class="card-corner tr"></div>
      <div class="card-corner bl"></div><div class="card-corner br"></div>
      <div class="method-tag" style="color:var(--warn); border-color:var(--warn)">METHOD 03</div>
      <div class="icon-wrap">
        <i class='bx bx-network-chart' style="color:var(--warn); filter:drop-shadow(0 0 10px var(--warn))"></i>
        <div class="icon-rings">
          <div class="ring r1" style="border-color:rgba(255,170,0,0.3)"></div>
        </div>
      </div>
      <h2>Signal Intercept</h2>
      <p>Triangulate active cell tower handoffs and isolate localized frequency emissions</p>
      <div class="card-divider"></div>
      <div class="card-meta">
        <span><i class='bx bx-broadcast'></i> 5G/LTE Sub-6</span>
      </div>
      <a href="#" class="scan-btn" style="background: rgba(255,170,0,0.05); color: var(--warn); border-color: rgba(255,170,0,0.3)">
        <span class="btn-text">TRIANGULATE</span>
        <span class="btn-arrow"><i class='bx bx-right-arrow-alt'></i></span>
        <div class="btn-shine"></div>
      </a>
    </div>

    <div class="scan-box" id="scanBox4">
      <div class="card-glow"></div>
      <div class="card-corner tl"></div><div class="card-corner tr"></div>
      <div class="card-corner bl"></div><div class="card-corner br"></div>
      <div class="method-tag">METHOD 04</div>
      <div class="icon-wrap">
        <i class='bx bx-buildings'></i>
        <div class="icon-rings">
          <div class="ring r1"></div>
          <div class="ring r2"></div>
        </div>
      </div>
      <h2>CCTV Grid Access</h2>
      <p>Patch into municipal traffic and security camera subnets for route tracing</p>
      <div class="card-divider"></div>
      <div class="card-meta">
        <span><i class='bx bx-cctv'></i> 42 Nodes Active</span>
      </div>
      <a href="#" class="scan-btn">
        <span class="btn-text">CONNECT</span>
        <span class="btn-arrow"><i class='bx bx-right-arrow-alt'></i></span>
        <div class="btn-shine"></div>
      </a>
    </div>

    <div class="scan-box" id="scanBox5">
      <div class="card-glow"></div>
      <div class="card-corner tl"></div><div class="card-corner tr"></div>
      <div class="card-corner bl"></div><div class="card-corner br"></div>
      <div class="method-tag">METHOD 05</div>
      <div class="icon-wrap">
        <i class='bx bx-brain'></i>
        <div class="icon-rings">
          <div class="ring r1"></div>
          <div class="ring r3"></div>
        </div>
      </div>
      <h2>Behavioral Profile</h2>
      <p>Analyze transaction history and social graph for predictive pathing models</p>
      <div class="card-divider"></div>
      <div class="card-meta">
        <span><i class='bx bx-git-merge'></i> Predictive AI</span>
      </div>
      <a href="#" class="scan-btn">
        <span class="btn-text">GENERATE</span>
        <span class="btn-arrow"><i class='bx bx-right-arrow-alt'></i></span>
        <div class="btn-shine"></div>
      </a>
    </div>

    <div class="scan-box" id="scanBox6">
      <div class="card-glow"></div>
      <div class="card-corner tl"></div><div class="card-corner tr"></div>
      <div class="card-corner bl"></div><div class="card-corner br"></div>
      <div class="method-tag">METHOD 06</div>
      <div class="icon-wrap">
        <i class='bx bxs-file-doc'></i>
        <div class="icon-rings">
          <div class="ring r1"></div>
        </div>
      </div>
      <h2>Warrant DB Sync</h2>
      <p>Cross-reference outstanding federal warrants and immediate flight risks</p>
      <div class="card-divider"></div>
      <div class="card-meta">
        <span><i class='bx bx-server'></i> NCIC Link</span>
      </div>
      <a href="modules/law/law.html" class="scan-btn" data-type="warrant">
        <span class="btn-text">QUERY DB</span>
        <span class="btn-arrow"><i class='bx bx-right-arrow-alt'></i></span>
        <div class="btn-shine"></div>
      </a>
    </div>

    <!-- MALWARE DFIR CARD -->
    <div class="scan-box" id="scanBox7">
      <div class="card-glow" style="background: radial-gradient(circle, rgba(162,0,255,0.1) 0%, transparent 70%)"></div>
      <div class="card-corner tl"></div><div class="card-corner tr"></div>
      <div class="card-corner bl"></div><div class="card-corner br"></div>
      <div class="method-tag" style="color:#a200ff; border-color:rgba(162,0,255,0.4)">METHOD 07</div>
      <div class="icon-wrap">
        <i class='bx bx-bug' style="color:#a200ff;filter:drop-shadow(0 0 16px #a200ff)"></i>
        <div class="icon-rings">
          <div class="ring r1" style="border-color:rgba(162,0,255,0.25)"></div>
          <div class="ring r2" style="border-color:rgba(162,0,255,0.2)"></div>
          <div class="ring r3" style="border-color:rgba(162,0,255,0.15)"></div>
        </div>
      </div>
      <h2>Malware & Threat Intel</h2>
      <p>Analyze PCAPs and Executables for static PE features, C2 beacons, IOC extraction, and MITRE mapping</p>
      <div class="card-divider"></div>
      <div class="card-meta">
        <span><i class='bx bx-check-shield'></i> PE & PCAP</span>
      </div>
      <a href="modules/malware/dashboard.html" class="scan-btn" data-type="malware" style="background: rgba(162,0,255,0.1); color: #a200ff; border-color: rgba(162,0,255,0.3)">
        <span class="btn-text">LAUNCH ENGINE</span>
        <span class="btn-arrow"><i class='bx bx-right-arrow-alt'></i></span>
        <div class="btn-shine"></div>
      </a>
    </div>
'''

html = re.sub(r'<div class="scan-grid">.*?</div>\s*</div>\s*</main>', f'<div class="scan-grid">\\n{grid_content}\\n</div>\\n    </div>\\n  </main>', html, flags=re.DOTALL)

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
