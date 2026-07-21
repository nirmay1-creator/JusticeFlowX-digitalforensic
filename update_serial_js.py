import re

with open('frontend/modules/forensics/forensic-serial.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace runVerification logic
new_run_verification = '''
async function runVerification(serial, docType) {
  srpWaiting.style.display = 'none';
  srpResult.style.display = 'none';
  batchResults.style.display = 'none';
  srpScanning.style.display = 'block';

  // Build nodes
  const nodesEl = document.getElementById('ssaNodes');
  nodesEl.innerHTML = dbNodes.map(n => <div class="ssa-node" data-node=""></div>).join('');

  const textEl = document.getElementById('ssaText');
  const queryLog = document.getElementById('dbQueryLog');
  queryLog.innerHTML = '';

  const logMessages = [
    Parsing serial: ,
    Validating format against  schema...,
    Querying GOV-DB-01 primary registry...,
    Cross-checking INTERPOL lost/stolen documents...,
    Verifying national records...,
    Checking international registry...,
    Running revocation list scan...,
    Checking for duplicate usage across 4.2M records...,
    Analyzing issue date consistency...,
    Compiling verdict...
  ];

  let i = 0;
  let nodeIdx = 0;
  const nodeEls = nodesEl.querySelectorAll('.ssa-node');

  try {
      const response = await fetch('http://localhost:5001/api/doc/serial_verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serial, docType })
      });
      const data = await response.json();

      const logInterval = setInterval(() => {
        if (i < logMessages.length) {
          const div = document.createElement('div');
          div.textContent = logMessages[i];
          queryLog.appendChild(div);
          queryLog.scrollTop = queryLog.scrollHeight;
          textEl.textContent = logMessages[i];

          if (nodeIdx < nodeEls.length) {
            if (nodeIdx > 0) nodeEls[nodeIdx - 1].classList.remove('querying');
            if (nodeIdx > 0) nodeEls[nodeIdx - 1].classList.add('done');
            nodeEls[nodeIdx].classList.add('querying');
            nodeIdx++;
          }
          i++;
        } else {
          clearInterval(logInterval);
          nodeEls.forEach(n => { n.classList.remove('querying'); n.classList.add('done'); });
          setTimeout(() => showSerialResult(serial, docType, data), 500);
        }
      }, 350);
  } catch (err) {
      console.error(err);
      textEl.textContent = "SERVER CONNECTION ERROR";
  }
}
'''

js_content = re.sub(r'function runVerification\([\s\S]*?(?=function analyzeSerial)', new_run_verification, js_content)

# We can remove nalyzeSerial and alidateFormat from JS because the backend handles it.
js_content = re.sub(r'function analyzeSerial\([\s\S]*?(?=function validateFormat)', '', js_content)
js_content = re.sub(r'function validateFormat\([\s\S]*?(?=function showSerialResult)', '', js_content)

# Modify showSerialResult signature
js_content = js_content.replace('function showSerialResult(serial, docType) {', 'function showSerialResult(serial, docType, r) {')
js_content = js_content.replace('const r = analyzeSerial(serial, docType);', '')

# Replace runBatchVerification
new_batch = '''
async function runBatchVerification(serials) {
  srpWaiting.style.display = 'none';
  srpScanning.style.display = 'none';
  srpResult.style.display = 'none';
  batchResults.style.display = 'block';

  const summary = document.getElementById('brSummary');
  const tbody = document.getElementById('brTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:16px;font-family:var(--font-mono);font-size:11px">Scanning Server Database...</td></tr>';

  try {
      const response = await fetch('http://localhost:5001/api/doc/serial_batch_verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serials, docType: selectedType })
      });
      const data = await response.json();
      
      let valid = 0, invalid = 0, revoked = 0;
      
      const rows = data.results.map((r, i) => {
        let status, statusCls, risk;
        if (r.isClean) { status = 'VALID'; statusCls = 'verdict-clean'; risk = Math.floor(Math.random() * 15); valid++; }
        else if (r.isRevoked) { status = 'REVOKED'; statusCls = 'verdict-forged'; risk = 90 + Math.floor(Math.random() * 10); revoked++; }
        else if (r.isDuplicate) { status = 'DUPLICATE'; statusCls = 'verdict-forged'; risk = 80 + Math.floor(Math.random() * 15); invalid++; }
        else if (r.notFound) { status = 'NOT FOUND'; statusCls = 'verdict-forged'; risk = 75 + Math.floor(Math.random() * 20); invalid++; }
        else { status = 'FORMAT ERR'; statusCls = 'verdict-suspect'; risk = 50 + Math.floor(Math.random() * 30); invalid++; }
        const riskCls = risk < 30 ? 'check-pass' : risk < 60 ? 'check-warn' : 'check-fail';
        return <tr>
          <td style="color:var(--text-dim)"></td>
          <td style="font-family:var(--font-mono);color:var(--cyan-mid)"></td>
          <td class=""></td>
          <td class="" style="font-family:var(--font-head);font-weight:700">%</td>
          <td style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)"></td>
        </tr>;
      });

      tbody.innerHTML = rows.join('');

      summary.innerHTML = 
        <div class="brs-item"><span class="brs-val"></span><span class="brs-lbl">TOTAL SCANNED</span></div>
        <div class="brs-item"><span class="brs-val" style="color:var(--green)"></span><span class="brs-lbl">VALID</span></div>
        <div class="brs-item"><span class="brs-val" style="color:var(--red)"></span><span class="brs-lbl">INVALID / FAKE</span></div>
        <div class="brs-item"><span class="brs-val" style="color:var(--warn)"></span><span class="brs-lbl">REVOKED</span></div>
      ;

  } catch (err) {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--red);">Server Connection Error</td></tr>';
  }
}
'''
js_content = re.sub(r'function runBatchVerification\([\s\S]*?(?=\n// Init DB last sync time)', new_batch, js_content)

with open('frontend/modules/forensics/forensic-serial.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
