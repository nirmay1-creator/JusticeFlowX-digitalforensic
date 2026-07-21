html_content = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>JusticeFlowX | Professional Chain of Custody</title>
  <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
  <link rel="stylesheet" href="chain.css">
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
</head>
<body>

  <!-- Background Effects -->
  <div class="cyber-grid"></div>
  <div class="vignette"></div>

  <!-- Header -->
  <header class="topbar">
    <div class="brand">
      <i class='bx bx-link'></i>
      <span>CHAIN OF CUSTODY & EVIDENCE MANAGEMENT</span>
    </div>
    <div class="user-info">
      <button class="tech-btn" onclick="showTechStack()"><i class='bx bx-server'></i> TECH STACK</button>
      <span class="clearance">CLEARANCE: LEVEL 5</span>
      <span class="user">AGENT 007</span>
    </div>
  </header>

  <!-- Export Toolbar -->
  <div class="export-toolbar">
    <button onclick="exportItem('PCAP')"><i class='bx bx-download'></i> Export PCAP</button>
    <button onclick="exportItem('PDF Investigation Report')"><i class='bx bxs-file-pdf'></i> Export PDF Report</button>
    <button onclick="exportItem('CSV Packet Data')"><i class='bx bx-table'></i> Export CSV</button>
    <button onclick="exportItem('JSON Evidence')"><i class='bx bx-code-curly'></i> Export JSON</button>
    <button onclick="exportItem('Network Traffic Statistics')"><i class='bx bx-line-chart'></i> Export Traffic Stats</button>
    <button onclick="exportItem('Threat Intelligence Report')"><i class='bx bx-shield-quarter'></i> Export Threat Intel</button>
  </div>

  <main class="container">
    
    <!-- Upload / Register new evidence -->
    <section class="card upload-card" style="flex: 1.5;">
      <div class="card-header">
        <i class='bx bx-lock-alt'></i> SECURE EVIDENCE UPLOAD
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="input-group">
            <label>Evidence ID</label>
            <input type="text" id="evId" placeholder="EVID-10492" value="EVID-10492">
          </div>
          <div class="input-group">
            <label>Case ID</label>
            <input type="text" id="evCaseId" placeholder="CAS-9824" value="CAS-9824">
          </div>
          <div class="input-group" style="grid-column: span 2;">
            <label>Evidence Name</label>
            <input type="text" id="evName" placeholder="e.g. Server Traffic PCAP">
          </div>
          
          <div class="input-group">
            <label>Evidence Type</label>
            <select id="evType">
              <option>PCAP File</option>
              <option>Network Log</option>
              <option>Screenshot</option>
              <option>Digital Evidence</option>
            </select>
          </div>
          <div class="input-group">
            <label>File Size</label>
            <input type="text" id="evSize" placeholder="e.g. 450 MB">
          </div>

          <div class="input-group">
            <label>Investigator Name</label>
            <input type="text" id="evInvestigator" placeholder="Agent 007">
          </div>
          <div class="input-group">
            <label>Collection Device</label>
            <input type="text" id="evDevice" placeholder="e.g. Wireshark Node 3">
          </div>

          <div class="input-group">
            <label>Source IP</label>
            <input type="text" id="evSrcIp" placeholder="192.168.1.10">
          </div>
          <div class="input-group">
            <label>Destination IP</label>
            <input type="text" id="evDstIp" placeholder="10.0.0.5">
          </div>

          <div class="input-group">
            <label>Collection Method</label>
            <select id="evMethod">
              <option>Deep Packet Inspection (DPI)</option>
              <option>Port Mirroring</option>
              <option>Live RAM Dump</option>
              <option>Drive Cloning</option>
            </select>
          </div>
          <div class="input-group">
            <label>Storage Location</label>
            <input type="text" id="evLocation" placeholder="Secure Vault Sector 4">
          </div>

          <div class="input-group" style="grid-column: span 2;">
            <label>Investigator Notes / Tags</label>
            <input type="text" id="evNotes" placeholder="e.g. #malware, #cve-2024, High Priority">
          </div>
        </div>

        <button class="cyber-btn" onclick="addLog()" style="margin-top: 20px;">
          <i class='bx bx-fingerprint'></i> INITIATE HASHING & SECURE UPLOAD
        </button>
      </div>
    </section>

    <!-- Timeline / Ledger -->
    <section class="card ledger-card" style="flex: 2.5;">
      <div class="card-header" style="justify-content: space-between;">
        <span><i class='bx bx-history'></i> AUDIT TRAIL & VERIFICATION</span>
        <div style="display:flex; gap:10px;">
            <input type="text" id="searchAudit" placeholder="Search Hash / ID..." onkeyup="filterLedger()" style="padding: 5px 10px; width: 200px;">
            <button class="tech-btn" onclick="document.getElementById('ledgerList').innerHTML=''" style="color:var(--red);border-color:var(--red)"><i class='bx bx-trash'></i> ADMIN WIPE</button>
        </div>
      </div>
      <div class="card-body ledger-body" id="ledgerList">
        <!-- Logs will be populated here by JS -->
      </div>
    </section>

  </main>

  <!-- Bottom Nav -->
  <div class="bottom-nav">
    <a href="../../index.html" class="back-btn"><i class='bx bx-arrow-back'></i> Return to Core System</a>
  </div>

  <!-- Tech Stack Modal -->
  <div id="techModal" class="modal">
    <div class="modal-content">
      <span class="close" onclick="closeTechStack()">&times;</span>
      <h2 style="color:var(--cyan); margin-bottom: 20px; font-family:'Share Tech Mono', monospace;"><i class='bx bx-server'></i> SYSTEM ARCHITECTURE & TECH STACK</h2>
      <div class="tech-grid">
        <div class="tech-col">
            <h3>Frontend</h3>
            <ul><li>HTML5, CSS3, JavaScript (ES6+)</li><li>Chart.js (Data Vis)</li><li>GSAP (Animations)</li><li>Font Awesome (Icons)</li></ul>
            <h3>Backend</h3>
            <ul><li>Python 3 & Flask</li><li>Flask-RESTful & Flask-JWT-Extended</li><li>Flask-SocketIO</li></ul>
            <h3>Database</h3>
            <ul><li>SQLite (Dev) / PostgreSQL (Prod)</li><li>SQLAlchemy ORM</li></ul>
        </div>
        <div class="tech-col">
            <h3>Network Forensics</h3>
            <ul><li>Scapy (Packet Capture)</li><li>PyShark (PCAP Parsing)</li><li>Tshark (Wireshark CLI)</li><li>Socket Programming</li></ul>
            <h3>Threat Intelligence</h3>
            <ul><li>VirusTotal API</li><li>AbuseIPDB API</li><li>GeoLite2 (GeoIP)</li><li>MITRE ATT&CK Framework</li></ul>
            <h3>Digital Forensics</h3>
            <ul><li>SHA-256 / MD5 / SHA-1</li><li>Chain of Custody Mgmt</li><li>Metadata Extraction</li></ul>
        </div>
        <div class="tech-col">
            <h3>Security</h3>
            <ul><li>JWT Auth</li><li>Role-Based Access Control</li><li>Password Hashing (bcrypt)</li><li>Audit Logging</li></ul>
            <h3>Deployment</h3>
            <ul><li>Docker & Docker Compose</li><li>Nginx & Gunicorn</li><li>Linux (Ubuntu)</li></ul>
            <h3>Supported Files</h3>
            <ul><li>.pcap, .pcapng, .csv, .json, .pdf, .log</li></ul>
        </div>
      </div>
    </div>
  </div>

  <script src="chain.js"></script>
</body>
</html>'''

with open('frontend/modules/chain_of_custody/index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)
