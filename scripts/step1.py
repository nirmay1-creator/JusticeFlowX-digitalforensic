with open('frontend/modules/network_forensics/forensics_dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

exports_html = '''      <div class="export-controls" style="display:flex;gap:15px;margin-top:25px;justify-content:center;z-index:20;position:relative;">
        <button class="scan-btn" onclick="exportData('pcap')" style="padding:12px 24px;font-size:14px;min-height:unset;width:auto;"><i class='bx bx-download'></i> Export PCAP</button>
        <button class="scan-btn" onclick="exportData('pdf')" style="padding:12px 24px;font-size:14px;min-height:unset;width:auto;border-color:#ff9f43;color:#ff9f43;background:rgba(255,159,67,0.1)"><i class='bx bxs-file-pdf'></i> Export PDF Report</button>
        <button class="scan-btn" onclick="exportData('csv')" style="padding:12px 24px;font-size:14px;min-height:unset;width:auto;border-color:#00ff88;color:#00ff88;background:rgba(0,255,136,0.1)"><i class='bx bx-table'></i> Export CSV</button>
      </div>'''

content = content.replace('<p class="hero-sub">Deep Packet Inspection and Threat Intelligence for Cyber Crime Investigation</p>', 
                          '<p class="hero-sub">Deep Packet Inspection and Threat Intelligence for Cyber Crime Investigation</p>\n' + exports_html)

with open('frontend/modules/network_forensics/forensics_dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

with open('frontend/modules/network_forensics/forensics.js', 'a', encoding='utf-8') as f:
    f.write('''
// Export Functionality
function exportData(type) {
  let content = "";
  let filename = "";
  let mimeType = "";

  if (type === 'pcap') {
    content = "dummy pcap binary data blob...";
    filename = "capture_log_7849.pcap";
    mimeType = "application/vnd.tcpdump.pcap";
  } else if (type === 'pdf') {
    content = "dummy pdf binary data blob...";
    filename = "forensics_report.pdf";
    mimeType = "application/pdf";
  } else if (type === 'csv') {
    content = "Timestamp,Source,Destination,Protocol,Length,Info\\n2026-07-19 10:15:32,192.168.1.5,10.0.0.1,TCP,64,SYN\\n";
    filename = "traffic_analysis.csv";
    mimeType = "text/csv";
  }

  // Create a blob and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Show a mini notification if possible, or just alert
  alert("Exporting " + filename.toUpperCase() + "...");
}
''')
