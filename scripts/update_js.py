import re

with open('frontend/modules/malware/js/dfir.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

new_logic = '''
    // 5. Analysis Trigger (Real Backend Connection)
    analyzeBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        // UI Reset
        analyzeBtn.style.display = 'none';
        const progressContainer = document.getElementById('analysisProgress');
        const progressBar = document.getElementById('progressBar');
        const progressStatus = document.getElementById('progressStatus');
        progressContainer.style.display = 'block';

        const isPCAP = currentFile.name.toLowerCase().endsWith('.pcap') || currentFile.name.toLowerCase().endsWith('.pcapng');
        const isExe = currentFile.name.toLowerCase().endsWith('.exe') || currentFile.name.toLowerCase().endsWith('.dll');

        // Initial fake progress to show activity while server processes
        progressStatus.textContent = "Uploading evidence to engine...";
        progressBar.style.width = "20%";

        const formData = new FormData();
        formData.append('file', currentFile);

        try {
            const response = await fetch('http://localhost:5002/api/malware/analyze', {
                method: 'POST',
                body: formData
            });

            progressBar.style.width = "80%";
            progressStatus.textContent = "Parsing analysis results...";
            
            const data = await response.json();
            
            if (data.error) {
                alert("Analysis Error: " + data.error);
                progressContainer.style.display = 'none';
                analyzeBtn.style.display = 'flex';
                return;
            }

            progressBar.style.width = "100%";
            progressStatus.textContent = "Analysis Complete!";
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
                analyzeBtn.style.display = 'flex';
                analyzeBtn.textContent = 'RE-ANALYZE EVIDENCE';
                
                if (data.is_exe) populateExeRealData(data);
                else if (data.is_pcap) populatePcapRealData(data);
                else populateExeRealData(data); // Fallback
            }, 500);

        } catch (err) {
            console.error(err);
            progressStatus.textContent = "Server Connection Failed!";
            progressStatus.style.color = "red";
            setTimeout(() => {
                progressContainer.style.display = 'none';
                analyzeBtn.style.display = 'flex';
            }, 2000);
        }
    });

    // 6. Real Data Injectors
    function populateExeRealData(data) {
        const file = data;
        const an = data.analysis || {};
        
        // Overall Dashboard
        let riskScore = 2.0;
        let yaraMatches = 0;
        
        if (an.packed) riskScore += 3.0;
        if (an.apis && an.apis.length > 0) riskScore += (an.apis.length * 0.5);
        if (riskScore > 10) riskScore = 10.0;
        
        document.getElementById('threatScore').textContent = Math.round(riskScore * 10);
        const circle = document.getElementById('threatScoreCircle');
        const level = document.getElementById('threatLevel');
        
        if (riskScore > 7) {
            circle.className = 'score-circle danger';
            level.textContent = 'HIGH RISK';
            level.className = 'threat-level danger';
        } else if (riskScore > 4) {
            circle.className = 'score-circle warn';
            level.textContent = 'SUSPICIOUS';
            level.className = 'threat-level warn';
        } else {
            circle.className = 'score-circle safe';
            level.textContent = 'CLEAN';
            level.className = 'threat-level safe';
        }
        
        document.getElementById('valRisk').textContent = riskScore.toFixed(1) + ' / 10';
        document.getElementById('valYara').textContent = 'None (Requires YARA module)';
        
        // Tab: Static Analysis
        document.getElementById('st-filename').textContent = file.filename;
        document.getElementById('st-size').textContent = (file.size / 1024).toFixed(2) + ' KB';
        document.getElementById('st-md5').textContent = file.md5;
        document.getElementById('st-sha256').textContent = file.sha256;
        document.getElementById('st-compile').textContent = an.compile_time || 'Unknown';
        document.getElementById('st-arch').textContent = an.arch || 'Unknown';
        
        document.getElementById('st-entropy').textContent = an.entropy || '0.0';
        document.getElementById('st-entropy-bar').style.width = ((an.entropy || 0)/8)*100 + '%';
        if (an.packed) document.getElementById('st-entropy-bar').classList.add('high');
        
        const packedEl = document.getElementById('st-packed');
        if (an.packed) {
            packedEl.textContent = 'LIKELY PACKED (High Entropy)';
            packedEl.className = 'packing-verdict packed';
        } else {
            packedEl.textContent = 'NOT PACKED';
            packedEl.className = 'packing-verdict';
        }

        const apiList = document.getElementById('st-apis');
        if (an.apis && an.apis.length > 0) {
            apiList.innerHTML = an.apis.map(api => <li> + api + </li>).join('');
        } else {
            apiList.innerHTML = <li class="empty-list">No suspicious APIs detected</li>;
        }

        // Tab: MITRE
        const mitreGrid = document.getElementById('mitre-grid');
        if (an.mitre && an.mitre.length > 0) {
            mitreGrid.innerHTML = an.mitre.map(m => 
                <div class="mitre-card"><span class="mitre-id"> + m.id + </span><div class="mitre-name"> + m.name + </div><div class="mitre-desc"> + m.desc + </div></div>
            ).join('');
        } else {
            mitreGrid.innerHTML = <div class="empty-list">No MITRE tactics mapped.</div>;
        }

        // Tab: AI
        document.getElementById('genAiBtn').disabled = false;
        document.getElementById('genAiBtn').onclick = () => {
            document.getElementById('ai-report-body').innerHTML = 
                <div class="ai-report">
                    <h3>EXECUTIVE SUMMARY</h3>
                    <p>The analyzed executable <strong> + file.filename + </strong> exhibits an entropy of  + an.entropy +  and utilizes  + (an.apis ? an.apis.length : 0) +  suspicious APIs. Risk score assessed at  + riskScore.toFixed(1) + /10.</p>
                    <p style="color:var(--cyan); margin-top:20px; font-family:'JetBrains Mono'">Report Generated by JusticeFlowX AI Engine</p>
                </div>
            ;
        };
    }

    function populatePcapRealData(data) {
        const file = data;
        const an = data.analysis || {};
        
        // Overall Dashboard
        let riskScore = 3.0;
        if (an.behaviors && an.behaviors.length > 0) riskScore += (an.behaviors.length * 2);
        
        document.getElementById('threatScore').textContent = Math.round(riskScore * 10);
        const circle = document.getElementById('threatScoreCircle');
        const level = document.getElementById('threatLevel');
        
        if (riskScore > 7) {
            circle.className = 'score-circle danger';
            level.textContent = 'HIGH RISK';
            level.className = 'threat-level danger';
        } else if (riskScore > 4) {
            circle.className = 'score-circle warn';
            level.textContent = 'SUSPICIOUS';
            level.className = 'threat-level warn';
        } else {
            circle.className = 'score-circle safe';
            level.textContent = 'CLEAN';
            level.className = 'threat-level safe';
        }
        
        document.getElementById('valRisk').textContent = riskScore.toFixed(1) + ' / 10';
        document.getElementById('valC2').textContent = 'Analyzing...';
        document.getElementById('valBeacon').textContent = 'Analyzing...';
        document.getElementById('valDns').textContent = an.protocols && an.protocols[3] > 200 ? 'Suspicious' : 'Normal';
        
        // Tab: Network
        if (an.protocols) {
            window.protocolChart.data.datasets[0].data = an.protocols;
            window.protocolChart.update();
        }

        const nwBehaviors = document.getElementById('nw-behaviors');
        if (an.behaviors && an.behaviors.length > 0) {
            nwBehaviors.innerHTML = an.behaviors.map(b => 
                <div class="behavior-item  + (b.danger ? 'danger' : '') + ">
                    <div class="behavior-title"> + b.title + </div>
                    <div class="behavior-desc"> + b.desc + </div>
                </div>
            ).join('');
        } else {
            nwBehaviors.innerHTML = <div class="empty-list" style="margin-top: 40px; text-align:center;">No suspicious network behaviors detected.</div>;
        }

        // Tab: IOCs
        const iocTable = document.getElementById('ioc-table-body');
        if (an.iocs && an.iocs.length > 0) {
            iocTable.innerHTML = an.iocs.map(ioc => 
                <tr>
                    <td><span style="background:rgba(0,210,255,0.2); padding:2px 6px; border-radius:4px;"> + ioc.type + </span></td>
                    <td class="mono"> + ioc.value + </td>
                    <td class="text-red"> + ioc.reputation + </td>
                    <td>Just now</td>
                </tr>
            ).join('');
        }

        // Tab: MITRE
        const mitreGrid = document.getElementById('mitre-grid');
        if (an.mitre && an.mitre.length > 0) {
            mitreGrid.innerHTML = an.mitre.map(m => 
                <div class="mitre-card"><span class="mitre-id"> + m.id + </span><div class="mitre-name"> + m.name + </div><div class="mitre-desc"> + m.desc + </div></div>
            ).join('');
        } else {
            mitreGrid.innerHTML = <div class="empty-list">No MITRE tactics mapped.</div>;
        }

        // Tab: AI
        document.getElementById('genAiBtn').disabled = false;
        document.getElementById('genAiBtn').onclick = () => {
            document.getElementById('ai-report-body').innerHTML = 
                <div class="ai-report">
                    <h3>EXECUTIVE SUMMARY</h3>
                    <p>The analyzed PCAP file <strong> + file.filename + </strong> exhibits  + (an.behaviors ? an.behaviors.length : 0) +  anomalies.</p>
                    <p style="color:var(--cyan); margin-top:20px; font-family:'JetBrains Mono'">Report Generated by JusticeFlowX AI Engine</p>
                </div>
            ;
        };
    }
'''

# Use regex to strip out everything from "// 5. Analysis Trigger" down, and append our new logic
js_content = re.sub(r'// 5\. Analysis Trigger[\s\S]*', new_logic, js_content)

with open('frontend/modules/malware/js/dfir.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
