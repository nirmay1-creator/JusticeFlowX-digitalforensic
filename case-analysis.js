/* ================================================
   JUSTICEFLOWX — APP.JS v2.5
   Enhanced: Report Upload, Evidence Upload, Criminal DB Check,
   Prior Crime Detection, AI Sentencing
   ================================================ */

/* ── Criminal Database ── */
const CRIMINAL_DB = [
  { id:"C001", name:"Arjun Mehta",    crimeCode:"murder",         crime:"1st Degree Murder",       status:"Arrested",            lastLocation:"Mumbai",    priorOffenses:["robbery","assault"] },
  { id:"C002", name:"Ravi Sharma",    crimeCode:"robbery",        crime:"Armed Robbery",            status:"Wanted",              lastLocation:"Delhi",     priorOffenses:["theft"] },
  { id:"C003", name:"Suresh Kumar",   crimeCode:"theft",          crime:"Grand Theft",              status:"Under Investigation", lastLocation:"Pune",      priorOffenses:[] },
  { id:"C004", name:"Vikram Singh",   crimeCode:"assault",        crime:"Grievous Assault",         status:"Arrested",            lastLocation:"Chennai",   priorOffenses:["assault"] },
  { id:"C005", name:"Deepak Nair",    crimeCode:"cyber_fraud",    crime:"Cyber Fraud ₹2.4Cr",      status:"Wanted",              lastLocation:"Bengaluru", priorOffenses:["identity_theft"] },
  { id:"C006", name:"Anil Gupta",     crimeCode:"hacking",        crime:"Infrastructure Hack",      status:"Arrested",            lastLocation:"Hyderabad", priorOffenses:["hacking","cyber_fraud"] },
  { id:"C007", name:"Pradeep Rao",    crimeCode:"kidnapping",     crime:"Child Abduction",          status:"Wanted",              lastLocation:"Kolkata",   priorOffenses:["kidnapping"] },
  { id:"C008", name:"Manoj Tiwari",   crimeCode:"corruption",     crime:"Bribery ₹50L",            status:"Under Investigation", lastLocation:"Lucknow",   priorOffenses:["corruption"] },
  { id:"C009", name:"Santosh Yadav",  crimeCode:"extortion",      crime:"Extortion Ring",           status:"Arrested",            lastLocation:"Nagpur",    priorOffenses:["extortion","robbery"] },
  { id:"C010", name:"Farhan Ahmed",   crimeCode:"terrorism",      crime:"Conspiracy",               status:"Arrested",            lastLocation:"Classified",priorOffenses:["terrorism"] },
  { id:"C011", name:"Kiran Patel",    crimeCode:"identity_theft", crime:"ID Theft x12",            status:"Wanted",              lastLocation:"Ahmedabad", priorOffenses:["cyber_fraud"] },
  { id:"C012", name:"Ramesh Dubey",   crimeCode:"trafficking",    crime:"Human Trafficking",        status:"Wanted",              lastLocation:"Jaipur",    priorOffenses:["trafficking","kidnapping"] },
  { id:"C013", name:"Sunil Pandey",   crimeCode:"murder",         crime:"Contract Killing",         status:"Wanted",              lastLocation:"Varanasi",  priorOffenses:["murder","assault"] },
  { id:"C014", name:"Harsh Verma",    crimeCode:"robbery",        crime:"Bank Heist",               status:"Arrested",            lastLocation:"Bhopal",    priorOffenses:["robbery","theft"] },
  { id:"C015", name:"Dinesh Lal",     crimeCode:"cyber_fraud",    crime:"Phishing Campaign",        status:"Under Investigation", lastLocation:"Patna",     priorOffenses:[] },
];

/* ── IPC Crime Map ── */
const CRIME_DATA = {
  murder:         { ipc:["IPC 300","IPC 302"],              bail:"None",   action:"Fast-track court filing — CBI involvement recommended", sentence:"Life imprisonment to death penalty", minYears:25 },
  attempt_murder: { ipc:["IPC 307","IPC 308"],              bail:"None",   action:"Immediate custody — remand for 14 days",               sentence:"7–14 years rigorous imprisonment",   minYears:7  },
  assault:        { ipc:["IPC 351","IPC 352","IPC 323"],    bail:"Medium", action:"Medical report mandatory — FIR filing",                sentence:"1–3 years imprisonment + fine",       minYears:1  },
  robbery:        { ipc:["IPC 390","IPC 392","IPC 397"],    bail:"Low",    action:"Immediate arrest warrant — asset seizure",             sentence:"3–10 years rigorous imprisonment",   minYears:3  },
  theft:          { ipc:["IPC 378","IPC 379"],              bail:"High",   action:"Issue notice — proceed with investigation",            sentence:"6 months–3 years imprisonment",      minYears:0.5},
  kidnapping:     { ipc:["IPC 359","IPC 363","IPC 364A"],   bail:"None",   action:"PRIORITY — immediate multi-agency response",           sentence:"7 years to life imprisonment",       minYears:7  },
  extortion:      { ipc:["IPC 384"],                        bail:"Low",    action:"Immediate arrest — asset freeze",                      sentence:"3–7 years rigorous imprisonment",    minYears:3  },
  trafficking:    { ipc:["IPC 370","IPC 370A"],             bail:"None",   action:"Rescue operation — NHRC notification",                 sentence:"7 years to life imprisonment",       minYears:7  },
  cyber_fraud:    { ipc:["IPC 420","IT Act 66D","IT Act 66C"],bail:"Medium",action:"Cyber Cell involvement — digital evidence seizure",   sentence:"3–7 years + fine up to ₹1 crore",   minYears:3  },
  identity_theft: { ipc:["IPC 419","IT Act 66C"],           bail:"Medium", action:"Digital forensics — freeze accounts immediately",      sentence:"3–5 years + fine",                   minYears:3  },
  hacking:        { ipc:["IT Act 43","IT Act 66"],          bail:"Medium", action:"Server seizure — national cybersecurity alert",        sentence:"3–5 years + fine up to ₹5 lakh",    minYears:3  },
  terrorism:      { ipc:["UAPA Sec 15","UAPA Sec 16"],      bail:"None",   action:"CLASSIFIED PROTOCOL — NIA involvement mandatory",      sentence:"10 years to death penalty",          minYears:10 },
  corruption:     { ipc:["PC Act 7","PC Act 13"],           bail:"Low",    action:"CBI referral — asset attachment under PMLA",           sentence:"3–7 years + asset forfeiture",       minYears:3  },
};

const FAILURE_PATTERNS = [
  "Witness Turned Hostile","Insufficient Forensic Evidence","Procedural Irregularities",
  "Chain of Custody Breach","Delayed Investigation","Weak Prosecution Brief",
  "Evidence Admissibility Issues","Jurisdiction Conflict","Missing Documentation"
];

const SCAN_STEPS = [
  "PARSING CRIME PARAMETERS",
  "CROSS-REFERENCING CRIMINAL DATABASE",
  "CHECKING PRIOR OFFENSE RECORDS",
  "VERIFYING UPLOADED EVIDENCE",
  "RUNNING NEURAL INFERENCE",
  "MATCHING IPC SECTIONS",
  "COMPUTING CONVICTION PROBABILITY",
  "CALCULATING SENTENCE WITH PRIORS",
  "GENERATING JUDICIAL ASSESSMENT",
  "ANALYSIS COMPLETE"
];

let evidenceQuality = "strong";
let statusFilter = "all";
let uploadedReports = [];
let uploadedEvidence = [];
let currentAccused = "";
let priorMatchedCriminals = [];

/* ── Clock ── */
function updateClock() {
  document.getElementById("clock").textContent = new Date().toTimeString().slice(0,8);
}
setInterval(updateClock, 1000); updateClock();

/* ── DB Count ── */
if(document.getElementById("dbCount")) document.getElementById("dbCount").textContent = CRIMINAL_DB.length + 200;

/* ── Canvas Background ── */
function initCanvas() {
  const canvas = document.getElementById("bgCanvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);
  const nodes = [];
  for(let i=0;i<60;i++) nodes.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3, r:Math.random()*2+1 });
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    nodes.forEach(n => { n.x+=n.vx; n.y+=n.vy; if(n.x<0)n.x=canvas.width; if(n.x>canvas.width)n.x=0; if(n.y<0)n.y=canvas.height; if(n.y>canvas.height)n.y=0; });
    nodes.forEach((n,i) => {
      nodes.slice(i+1).forEach(m => {
        const dx=m.x-n.x, dy=m.y-n.y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<150) { ctx.beginPath(); ctx.strokeStyle=`rgba(0,240,255,${0.08*(1-d/150)})`; ctx.lineWidth=0.5; ctx.moveTo(n.x,n.y); ctx.lineTo(m.x,m.y); ctx.stroke(); }
      });
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fillStyle="rgba(0,240,255,0.3)"; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ── Severity Sync ── */
function syncSeverity(val) {
  val = Math.max(1, Math.min(10, parseInt(val)||5));
  document.getElementById("severitySlider").value = val;
  document.getElementById("sevLabel").textContent = val;
  const pct = (val-1)/9*100;
  const color = val>=9?"#ff3860":val>=7?"#ff8c00":val>=4?"#ffd700":"#00f0ff";
  document.getElementById("severitySlider").style.background = `linear-gradient(to right, ${color} ${pct}%, rgba(0,240,255,0.12) ${pct}%)`;
}

/* ── Terminal Logger ── */
const termQueue = []; let termActive = false;
function termLog(msg) { termQueue.push(msg); if(!termActive) processTermQueue(); }
function processTermQueue() {
  if(!termQueue.length) { termActive=false; return; }
  termActive=true;
  const el = document.getElementById("termText");
  const msg = termQueue.shift();
  el.textContent=""; let i=0;
  const iv = setInterval(()=>{
    if(i<msg.length) { el.textContent+=msg[i++]; }
    else { clearInterval(iv); setTimeout(processTermQueue,1200); }
  },18);
}

/* ── Boot Sequence ── */
function runBoot() {
  const overlay = document.getElementById("bootOverlay");
  if(!overlay) return;
  const bar = document.getElementById("bootBar");
  const status = document.getElementById("bootStatus");
  const msgs = ["LOADING KERNEL MODULES…","INITIALIZING AI CORE…","CONNECTING TO DATABASE…","VERIFYING IPC INDEX…","SYSTEM READY"];
  let pct=0, idx=0;
  const iv = setInterval(()=>{
    pct+=100/(msgs.length*4); if(pct>=100)pct=100;
    bar.style.width=pct+"%";
    if(Math.floor(pct/20)>idx&&idx<msgs.length-1) { idx++; status.textContent=msgs[idx]; }
    if(pct>=100) {
      clearInterval(iv); status.textContent=msgs[msgs.length-1];
      setTimeout(()=>{ overlay.style.transition="opacity 0.6s ease"; overlay.style.opacity="0"; setTimeout(()=>overlay.remove(),600);
        termLog("SYSTEM READY — JUSTICEFLOWX v2.4 — AI CORE ONLINE — DATABASE: "+CRIMINAL_DB.length+" ACTIVE PROFILES");
      },400);
    }
  },60);
}

/* ── Tab Switching ── */
function switchTab(tab) {
  document.querySelectorAll(".tab-content").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  const el = document.getElementById("tab-"+tab);
  if(el) { el.classList.add("active"); }
  const btns = document.querySelectorAll(".tab-btn");
  const tabMap = {case:0,report:1,evidence:2,criminal:3};
  if(tabMap[tab]!==undefined && btns[tabMap[tab]]) btns[tabMap[tab]].classList.add("active");
  const titles = {case:"CASE PARAMETERS",report:"SUBMIT REPORT",evidence:"UPLOAD EVIDENCE",criminal:"CRIMINAL DATABASE"};
  const pt = document.getElementById("panelTitle");
  if(pt) pt.textContent = titles[tab]||"CASE PARAMETERS";
  if(tab==="criminal") { liveSearch(); termLog("DATABASE SEARCH ACTIVE — QUERY READY"); }
}

/* ── Report Upload ── */
function handleReportUpload(input) {
  const files = Array.from(input.files);
  files.forEach(f => {
    uploadedReports.push(f);
    renderFileList("reportFileList", uploadedReports);
  });
  termLog("REPORT FILE RECEIVED: "+files.map(f=>f.name).join(", "));
}

function submitReport() {
  const caseNo = document.getElementById("reportCaseNo").value;
  const desc = document.getElementById("reportDesc").value;
  const officer = document.getElementById("reportOfficer").value;
  if(!caseNo && !desc) {
    termLog("ERROR: REPORT SUBMISSION INCOMPLETE — ENTER CASE NUMBER AND DESCRIPTION");
    return;
  }
  termLog("REPORT SUBMITTED — CASE: "+(caseNo||"UNASSIGNED")+" — OFFICER: "+(officer||"UNSPECIFIED")+" — "+uploadedReports.length+" FILE(S) ATTACHED");
  const zone = document.getElementById("reportUploadZone");
  zone.style.borderColor="var(--green)";
  zone.innerHTML='<span style="font-family:var(--font-mono);font-size:10px;color:var(--green);letter-spacing:2px">✓ REPORT LOGGED SUCCESSFULLY</span>';
  setTimeout(()=>{ zone.style.borderColor=""; switchTab("case"); },1500);
}

/* ── Evidence Upload ── */
function handleEvidenceUpload(input) {
  const files = Array.from(input.files);
  files.forEach(f => {
    uploadedEvidence.push(f);
    renderFileList("evFileList", uploadedEvidence);
  });
  termLog("EVIDENCE FILE(S) RECEIVED: "+files.map(f=>f.name).join(", "));
}

function submitEvidence() {
  if(uploadedEvidence.length===0) { termLog("ERROR: NO EVIDENCE FILES UPLOADED — ATTACH FILES TO PROCEED"); return; }
  const evType = document.getElementById("evType").value;
  const caseRef = document.getElementById("evCaseRef").value;
  const desc = document.getElementById("evDesc").value;
  termLog("EVIDENCE LOGGED — TYPE: "+evType.toUpperCase()+" — "+uploadedEvidence.length+" FILE(S) — CASE: "+(caseRef||"UNLINKED"));
  const zone = document.getElementById("evUploadZone");
  zone.style.borderColor="var(--green)";
  zone.innerHTML='<span style="font-family:var(--font-mono);font-size:10px;color:var(--green);letter-spacing:2px">✓ EVIDENCE SECURED IN CHAIN OF CUSTODY</span>';
  setTimeout(()=>{ zone.style.borderColor=""; switchTab("case"); },1500);
}

function renderFileList(containerId, files) {
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = files.map((f,i)=>`
    <div class="file-item">
      <span class="file-item-name">${f.name}</span>
      <span class="file-item-size">${formatBytes(f.size)}</span>
      <span class="file-item-remove" onclick="removeFile('${containerId}',${i})">✕</span>
    </div>
  `).join("");
}

function removeFile(containerId, idx) {
  if(containerId==="reportFileList") { uploadedReports.splice(idx,1); renderFileList("reportFileList",uploadedReports); }
  else { uploadedEvidence.splice(idx,1); renderFileList("evFileList",uploadedEvidence); }
}

function formatBytes(b) {
  if(b<1024) return b+"B"; if(b<1048576) return (b/1024).toFixed(1)+"KB"; return (b/1048576).toFixed(1)+"MB";
}

/* ── Criminal DB Search ── */
function setStatusFilter(btn, status) {
  document.querySelectorAll("[data-status]").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  statusFilter = status;
  liveSearch();
}

function liveSearch() {
  const query = (document.getElementById("dbSearchName")||{value:""}).value.toLowerCase();
  const crime = (document.getElementById("dbFilterCrime")||{value:""}).value;
  let results = CRIMINAL_DB.filter(c => {
    const nameMatch = !query || c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query);
    const crimeMatch = !crime || c.crimeCode===crime;
    const statusMatch = statusFilter==="all" || c.status===statusFilter;
    return nameMatch && crimeMatch && statusMatch;
  });
  renderDbResults(results);
}

function renderDbResults(results) {
  const el = document.getElementById("dbResults");
  if(!el) return;
  if(results.length===0) {
    el.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;padding:16px;text-align:center">NO MATCHING RECORDS FOUND</div>';
    return;
  }
  el.innerHTML = `<div class="db-r-count">${results.length} RECORD(S) FOUND</div>` +
    results.map(c=>`
    <div class="db-result-item" onclick="loadProfile('${c.id}')">
      <div class="db-r-avatar">◉</div>
      <div>
        <div class="db-r-name">${c.name} <span style="color:var(--text-dim);font-size:8px">${c.id}</span></div>
        <div class="db-r-meta">${c.crime} · ${c.lastLocation}${c.priorOffenses.length>0?' · '+c.priorOffenses.length+' PRIOR(S)':''}</div>
      </div>
      <span class="db-r-badge ${c.status==="Wanted"?"badge-wanted":c.status==="Arrested"?"badge-arrested":"badge-invest"}">${c.status.toUpperCase()}</span>
    </div>
  `).join("");
}

function loadProfile(id) {
  const c = CRIMINAL_DB.find(x=>x.id===id);
  if(!c) return;
  document.getElementById("accusedName") && (document.getElementById("accusedName").value = c.name);
  const ct = document.getElementById("crimeType");
  if(ct) ct.value = c.crimeCode;
  switchTab("case");
  termLog("PROFILE LOADED: "+c.name+" ("+c.id+") — "+c.crime+" — PRIOR OFFENSES: "+(c.priorOffenses.length||"NONE"));
}

/* ── Check Prior Crimes ── */
function checkPriorCrimes(accusedName, crimeCode) {
  const matches = [];
  const nameLower = accusedName.toLowerCase().trim();
  CRIMINAL_DB.forEach(c => {
    const dbNameLower = c.name.toLowerCase();
    const nameMatch = nameLower.length >= 3 && (dbNameLower.includes(nameLower) || nameLower.includes(dbNameLower.split(" ")[0]));
    const crimeMatch = c.crimeCode === crimeCode;
    if(nameMatch || crimeMatch) {
      if(!matches.find(m=>m.id===c.id)) matches.push(c);
    }
  });
  return matches;
}

/* ── Run Analysis ── */
function runAnalysis() {
  const crime = document.getElementById("crimeType").value;
  const sev   = parseInt(document.getElementById("severitySlider").value);
  currentAccused = (document.getElementById("accusedName")||{value:""}).value.trim() || "UNKNOWN ACCUSED";

  if(!crime) {
    termLog("ERROR: NO CRIME TYPE SELECTED — PLEASE CONFIGURE CASE PARAMETERS");
    const sw = document.querySelector(".select-wrap");
    sw.style.boxShadow="0 0 16px rgba(255,56,96,0.5)";
    setTimeout(()=>sw.style.boxShadow="",1000);
    return;
  }

  // Check prior crimes before scanning
  priorMatchedCriminals = checkPriorCrimes(currentAccused, crime);

  document.getElementById("idleState").style.display="none";
  document.getElementById("resultsState").style.display="none";
  const scanEl = document.getElementById("scanState");
  scanEl.style.display="flex";

  const stepsEl = document.getElementById("scanSteps");
  stepsEl.innerHTML="";
  document.getElementById("scanLabel").textContent=SCAN_STEPS[0];

  let priorInfo = priorMatchedCriminals.length>0 ? " — "+priorMatchedCriminals.length+" PRIOR RECORD(S) FOUND" : " — NO PRIOR RECORDS";
  termLog("INITIATING ANALYSIS — CRIME: "+crime.toUpperCase()+" — SEVERITY: "+sev+"/10 — EVIDENCE: "+uploadedEvidence.length+" FILE(S)"+priorInfo);

  let step=0;
  const stepDivs=[];
  SCAN_STEPS.forEach((s,i)=>{
    const d=document.createElement("div"); d.textContent="○ "+s; d.style.color="var(--text-dim)"; stepsEl.appendChild(d); stepDivs.push(d);
  });

  const iv = setInterval(()=>{
    if(step>0) { stepDivs[step-1].textContent="✓ "+SCAN_STEPS[step-1]; stepDivs[step-1].className="step-done"; }
    if(step<SCAN_STEPS.length) {
      stepDivs[step].textContent="▶ "+SCAN_STEPS[step]; stepDivs[step].className="step-active";
      document.getElementById("scanLabel").textContent=SCAN_STEPS[step]; step++;
    } else {
      clearInterval(iv);
      setTimeout(()=>{ scanEl.style.display="none"; showResults(crime,sev,evidenceQuality); },300);
    }
  },280);
}

/* ── Show Results ── */
function showResults(crime, sev, evQuality) {
  const data = CRIME_DATA[crime] || { ipc:["IPC 34"], bail:"Medium", action:"Investigate and file FIR", sentence:"Varies by court discretion", minYears:1 };

  // Match by crime code
  const matches = CRIMINAL_DB.filter(c => c.crimeCode===crime || (c.crimeCode&&crime&&(c.crimeCode.includes(crime)||crime.includes(c.crimeCode))));

  // Conviction rate
  const convicted = matches.filter(c=>c.status==="Arrested").length;
  const base = matches.length>0 ? Math.round((convicted/matches.length)*100) : 55;
  const sevBonus  = sev>=9?12:sev>=7?8:sev>=4?4:0;
  const evBonus   = evQuality==="strong"?15:evQuality==="moderate"?5:-10;
  const evidenceBonus = uploadedEvidence.length*3;
  const priorBonus = priorMatchedCriminals.length>0 ? 8 : 0;
  const rate = Math.min(97, Math.max(20, base+sevBonus+evBonus+evidenceBonus+priorBonus+Math.floor(Math.random()*6)));

  const level = sev>=9?"CRITICAL":sev>=7?"HIGH":sev>=4?"MODERATE":"LOW";
  const failure = FAILURE_PATTERNS[Math.floor(Math.random()*FAILURE_PATTERNS.length)];

  animateNumber("convRate", rate, "%", 800);
  animateNumber("caseCount", matches.length, "", 600);
  document.getElementById("threatLevel").textContent = level;
  document.getElementById("threatLevel").style.color = sev>=9?"var(--red)":sev>=7?"var(--orange)":sev>=4?"var(--yellow)":"var(--green)";
  setTimeout(()=>{ document.getElementById("convBar").style.width=rate+"%"; },200);

  const jurisdiction = document.getElementById("jurisdiction").value;
  const jurisLabel = {district:"District Court",sessions:"Sessions Court",high:"High Court",supreme:"Supreme Court"}[jurisdiction]||"District Court";

  // Prior crimes info
  const hasPriors = priorMatchedCriminals.length>0;

  // Prior Crimes Block
  const pcBlock = document.getElementById("priorCrimesBlock");
  if(hasPriors) {
    pcBlock.style.display="block";
    document.getElementById("priorCrimesContent").innerHTML =
      priorMatchedCriminals.map(c=>`
        <div class="pcb-item">
          <div>
            <div class="pcb-item-name">${c.name} <span style="color:var(--text-dim);font-size:9px">${c.id}</span></div>
            <div class="pcb-item-crime">${c.crime} · ${c.lastLocation} · PRIOR OFFENSES: ${c.priorOffenses.length>0?c.priorOffenses.map(p=>p.replace(/_/g," ").toUpperCase()).join(", "):"NONE"}</div>
          </div>
          <span class="pcb-item-status">${c.status.toUpperCase()}</span>
        </div>
      `).join("")+
      `<div class="pcb-penalty-note">⚠ REPEAT OFFENDER — SENTENCE ENHANCEMENT APPLIED UNDER IPC 75 / CRPC 397 — MINIMUM SENTENCE INCREASED BY 25–50%</div>`;
  } else {
    pcBlock.style.display="none";
  }

  // Evidence Summary Block
  const esBlock = document.getElementById("evidenceSummaryBlock");
  if(uploadedEvidence.length>0 || uploadedReports.length>0) {
    esBlock.style.display="block";
    const tags = [];
    uploadedEvidence.forEach(f=>tags.push(f.name));
    uploadedReports.forEach(f=>tags.push(f.name+" (Report)"));
    document.getElementById("evidenceSummaryContent").innerHTML = tags.map(t=>`<span class="esb-tag">📎 ${t}</span>`).join("");
  } else {
    esBlock.style.display="none";
  }

  // AI Verdict body
  const priorText = hasPriors
    ? `<br><br><span class="hi-yellow">⚠ REPEAT OFFENDER DETECTED</span> — ${priorMatchedCriminals.length} prior criminal record(s) matched to accused <strong>${currentAccused}</strong>. Courts may apply enhanced sentencing under repeat offender provisions.`
    : `<br><br>No prior criminal record found for <span class="hi-green">${currentAccused}</span> in the database.`;

  const evidenceText = uploadedEvidence.length>0
    ? `<br><br>Digital evidence logged: <strong>${uploadedEvidence.length} file(s)</strong> — ${uploadedEvidence.map(f=>f.name).join(", ")}. Chain of custody secured.`
    : "";
  const reportText = uploadedReports.length>0
    ? `<br>Case report filed: <strong>${uploadedReports.length} document(s)</strong> attached.`
    : "";

  document.getElementById("vbBody").innerHTML = `
    Analysis complete for <strong>${crime.replace(/_/g," ").toUpperCase()}</strong> — 
    Accused: <strong>${currentAccused}</strong> — 
    Severity Index <strong>${sev}/10</strong> — Evidence: <strong class="${evQuality==="strong"?"hi-green":evQuality==="weak"?"hi-red":"hi-yellow"}">${evQuality.toUpperCase()}</strong><br><br>
    Based on <strong>${matches.length}</strong> matched profile(s) in the criminal database, AI systems project a 
    <strong>${rate}%</strong> conviction probability under <strong>${jurisLabel}</strong>.
    ${priorMatchedCriminals.length>0?" (Boosted due to repeat offense record.)":""}<br><br>
    Threat classification: <strong class="${sev>=9?"hi-red":sev>=7?"hi-yellow":""}">${level}</strong> — 
    Primary failure risk: <span class="hi-yellow">${failure}</span><br><br>
    Applicable IPC sections: <strong>${data.ipc.join(" · ")}</strong><br>
    Bail classification: <strong class="${data.bail==="None"?"hi-red":data.bail==="High"?"hi-green":"hi-yellow"}">${data.bail.toUpperCase()}</strong>
    ${priorText}${evidenceText}${reportText}
  `;
  document.getElementById("vbTime").textContent = new Date().toLocaleTimeString();

  document.getElementById("ipcSections").textContent = data.ipc.join(" · ");
  const bailEl = document.getElementById("bailStatus");
  bailEl.textContent = data.bail; bailEl.className="lc-val bail-val bail-"+data.bail.toLowerCase();
  document.getElementById("failRisk").textContent = failure;
  document.getElementById("recAction").textContent = data.action;

  // Sentence with prior crimes enhancement
  const priorMultiplier = hasPriors ? 1.4 : 1.0;
  const baseYears = Math.round(data.minYears*(0.8+sev*0.05)*priorMultiplier);
  const priorSentenceNote = hasPriors
    ? `<br><br><strong>AGGRAVATING FACTOR: Repeat offender — sentence enhanced by 25–50% under IPC 75.</strong> Prior offenses: ${priorMatchedCriminals.map(c=>c.crime).join("; ")}.`
    : "";
  const evidenceSentenceNote = uploadedEvidence.length>0
    ? `<br><br>Submitted digital evidence (${uploadedEvidence.length} file(s)) strengthens prosecution case. Forensic analysis recommended before filing.`
    : "";

  document.getElementById("sbBody").innerHTML = `
    Recommended sentence: <strong>${data.sentence}</strong><br><br>
    Based on severity (${sev}/10), evidence quality (${evQuality}), and ${hasPriors?"<strong>repeat offender status</strong>":"first-time offense"}, the AI recommends a 
    <strong>${baseYears} year</strong> minimum custodial sentence with full asset forfeiture proceedings.<br><br>
    Jurisdiction: <strong>${jurisLabel}</strong> — 
    ${rate>=75?'<strong>HIGH confidence</strong> — proceed with prosecution':rate>=50?'<span class="hi-yellow">MODERATE confidence</span> — strengthen evidence before filing':'<span class="hi-red">LOW confidence</span> — further investigation required'}
    ${priorSentenceNote}${evidenceSentenceNote}
  `;

  // Matched criminals
  const criminalsBlock = document.getElementById("criminalsBlock");
  if(matches.length>0) {
    criminalsBlock.style.display="block";
    document.getElementById("cbCount").textContent=matches.length+" RECORDS";
    document.getElementById("cbList").innerHTML=matches.map(c=>`
      <div class="criminal-item">
        <div class="ci-avatar">◉</div>
        <div>
          <div class="ci-name">${c.name} <small style="color:var(--text-dim);font-size:9px">${c.id}</small></div>
          <div class="ci-meta">${c.crime} · ${c.lastLocation}${c.priorOffenses.length>0?" · "+c.priorOffenses.length+" prior(s)":""}</div>
        </div>
        <span class="ci-badge ${c.status==="Wanted"?"badge-wanted":c.status==="Arrested"?"badge-arrested":"badge-invest"}">${c.status.toUpperCase()}</span>
      </div>
    `).join("");
  } else { criminalsBlock.style.display="none"; }

  document.getElementById("resultsState").style.display="flex";
  termLog("ANALYSIS COMPLETE — "+crime.toUpperCase()+" — ACCUSED: "+currentAccused+" — CONVICTION PROBABILITY: "+rate+"% — "+matches.length+" PROFILE(S) MATCHED"+(hasPriors?" — REPEAT OFFENDER DETECTED":"")+(uploadedEvidence.length>0?" — "+uploadedEvidence.length+" EVIDENCE FILE(S) LOGGED":""));
}

/* ── Number Animator ── */
function animateNumber(id, target, suffix, duration) {
  const el = document.getElementById(id); if(!el) return;
  const start = Date.now();
  const step = ()=>{ const prog=Math.min((Date.now()-start)/duration,1); const val=Math.round(prog*target); el.textContent=val+suffix; if(prog<1)requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", ()=>{
  initCanvas();
  runBoot();

  const slider = document.getElementById("severitySlider");
  if(slider) { slider.addEventListener("input", e=>syncSeverity(e.target.value)); syncSeverity(5); }

  const analyzeBtn = document.getElementById("analyzeBtn");
  if(analyzeBtn) analyzeBtn.addEventListener("click", runAnalysis);

  document.querySelectorAll(".toggle-btn[data-ev]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".toggle-btn[data-ev]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); evidenceQuality=btn.dataset.ev;
    });
  });

  // Drag & drop evidence
  ["evUploadZone","reportUploadZone"].forEach(zoneId=>{
    const zone = document.getElementById(zoneId);
    if(!zone) return;
    zone.addEventListener("dragover", e=>{ e.preventDefault(); zone.style.borderColor="var(--cyan)"; zone.style.background="var(--cyan-dim)"; });
    zone.addEventListener("dragleave", ()=>{ zone.style.borderColor=""; zone.style.background=""; });
    zone.addEventListener("drop", e=>{ e.preventDefault(); zone.style.borderColor=""; zone.style.background="";
      const files = Array.from(e.dataTransfer.files);
      if(zoneId==="evUploadZone") { files.forEach(f=>uploadedEvidence.push(f)); renderFileList("evFileList",uploadedEvidence); }
      else { files.forEach(f=>uploadedReports.push(f)); renderFileList("reportFileList",uploadedReports); }
    });
  });
});