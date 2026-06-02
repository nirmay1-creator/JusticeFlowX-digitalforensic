/* =============================================
   CRIMINAL DATABASE PAGE JS
   ============================================= */

let selectedId = null;

const ICON_MAP = {
  robbery:"bx-lock-open-alt", fraud:"bx-dollar-circle", assault:"bx-target-lock",
  hacking:"bx-code-alt", identity_theft:"bx-id-card", document_forgery:"bx-file-blank",
  trafficking:"bx-transfer", terrorism:"bx-bomb", corruption:"bx-briefcase",
  kidnapping:"bx-user-x", extortion:"bx-dollar", money_laundering:"bx-dollar-circle",
  arson:"bx-fire", rioting:"bx-group", domestic_violence:"bx-home",
  sexual_assault:"bx-shield-x", cyber_fraud:"bx-bug", narcotics:"bx-capsule",
  default:"bx-shield-quarter"
};

function dangerClass(d){ return d?.toLowerCase() || "medium"; }

function statusBadgeHTML(s){
  const cls = s==="Wanted"?"badge-wanted":s==="Arrested"?"badge-arrested":"badge-invest";
  return `<span class="badge ${cls}">${s}</span>`;
}

function buildCard(c, idx){
  const ic = ICON_MAP[c.crimeCode] || ICON_MAP.default;
  const dc = dangerClass(c.dangerLevel);
  return `
    <div class="c-card danger-${dc}" data-id="${c.id}" onclick="selectCriminal('${c.id}')">
      <div class="c-card-top">
        <div class="c-avatar"><i class='bx ${ic}'></i></div>
        <span class="c-danger-badge ${dc}">${c.dangerLevel}</span>
      </div>
      <div class="c-name">${c.name}</div>
      <div class="c-alias">aka "${c.alias}"</div>
      <div class="c-crime"><i class='bx ${ic}'></i>${c.crime}</div>
      <div class="c-card-footer">
        ${statusBadgeHTML(c.status)}
        <span class="c-case-id">${c.id}</span>
      </div>
    </div>`;
}

function renderGrid(list){
  const grid = document.getElementById("criminalGrid");
  const count = document.getElementById("recordCount");
  if(!list.length){
    grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:48px;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">⬡ NO RECORDS MATCH FILTERS</div>`;
  } else {
    grid.innerHTML = list.map((c,i)=>buildCard(c,i)).join("");
  }
  count.textContent = `Showing ${list.length} of ${CRIMINAL_DB.length} records`;
}

function buildDetailHTML(c){
  return `
    <div class="detail-header">
      <div>
        <div class="detail-name">${c.name}</div>
        <div class="detail-alias">AKA: ${c.alias}</div>
      </div>
      <div style="text-align:right">
        ${statusBadgeHTML(c.status)}
        <div class="detail-id" style="margin-top:6px">${c.id}</div>
      </div>
    </div>
    <div class="detail-body">

      <div class="detail-section">
        <div class="detail-section-title">Biometric & Physical</div>
        ${row("DOB", c.dob)} ${row("Age", c.age+" yrs")} ${row("Gender", c.gender)}
        ${row("Height", c.height)} ${row("Weight", c.weight)}
        ${row("Eyes", c.eyes)} ${row("Hair", c.hair)} ${row("Citizenship", c.citizenship)}
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Criminal Profile</div>
        ${row("Crime", c.crime)} ${row("IPC Charges", c.chargeIPC)}
        ${row("Danger Level", `<span class="c-danger-badge ${dangerClass(c.dangerLevel)}">${c.dangerLevel}</span>`)}
        ${row("Prior Convictions", c.priorConvictions)}
        ${row("Incident Date", c.incidentDate)}
        ${row("Court Date", c.courtDate)}
        ${row("Warrant No.", c.arrestWarrant)}
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Last Known Info</div>
        ${row("Location", c.lastLocation)}
        ${row("Address", c.address)}
        ${row("Case Officer", c.caseOfficer)}
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Modus Operandi</div>
        <div class="detail-modus">${c.modus}</div>
      </div>

      ${c.associates?.length ? `
      <div class="detail-section">
        <div class="detail-section-title">Known Associates</div>
        <div class="assoc-tags">${c.associates.map(a=>`<span class="assoc-tag">${a}</span>`).join("")}</div>
      </div>` : ""}

      ${c.notes ? `
      <div class="detail-section">
        <div class="detail-section-title">Officer Notes</div>
        <div class="detail-modus" style="border-color:var(--warn);color:var(--warn)">${c.notes}</div>
      </div>` : ""}

      <div class="detail-actions">
        <button class="fx-btn fx-btn-green" onclick="runBiometricScan('${c.id}')"><i class='bx bx-fingerprint'></i> Biometric Scan</button>
        <button class="fx-btn" onclick="printRecord('${c.id}')"><i class='bx bx-printer'></i> Export</button>
        ${c.status==="Wanted"?`<button class="fx-btn fx-btn-danger"><i class='bx bx-alarm'></i> Alert Units</button>`:""}
      </div>
    </div>`;
}

function row(label, val){
  return `<div class="detail-row"><span class="dr-label">${label}</span><span class="dr-val">${val}</span></div>`;
}

function selectCriminal(id){
  document.querySelectorAll(".c-card").forEach(c=>c.classList.remove("selected"));
  const card = document.querySelector(`.c-card[data-id="${id}"]`);
  if(card){ card.classList.add("selected"); card.scrollIntoView({behavior:"smooth",block:"nearest"}); }

  const c = CRIMINAL_DB.find(x=>x.id===id);
  if(!c) return;
  selectedId = id;

  document.getElementById("detailEmpty").style.display="none";
  const content = document.getElementById("detailContent");
  content.style.display="block";
  content.innerHTML = buildDetailHTML(c);
}

function runBiometricScan(id){
  const overlay = document.getElementById("scanOverlay");
  const fill = document.getElementById("scanBarFill");
  const label = document.getElementById("scanLabel");
  const steps = ["READING BIOMETRIC DATA…","CROSS-REFERENCING DATABASE…","VERIFYING IDENTITY…"];

  overlay.style.display="flex";
  fill.style.width="0%";

  const start = performance.now();
  const dur = 2800;

  (function update(now){
    const pct = Math.min((now-start)/dur*100,100);
    fill.style.width=pct+"%";
    label.textContent = steps[pct<33?0:pct<66?1:2];
    if(pct<100) requestAnimationFrame(update);
    else {
      overlay.style.display="none";
      showAccessPopup(true, null);
      const c=CRIMINAL_DB.find(x=>x.id===id);
      if(c) { addTerminalLog(`Biometric scan complete — ${c.name} [${c.id}]`,"ok"); }
    }
  })(performance.now());
}

function printRecord(id){
  const c=CRIMINAL_DB.find(x=>x.id===id);
  if(!c) return;
  const w=window.open("","_blank");
  w.document.write(`<pre style="font-family:monospace;padding:20px">${JSON.stringify(c,null,2)}</pre>`);
  w.print();
}

function addTerminalLog(text, cls=""){
  const body=document.getElementById("terminalBody");
  if(!body) return;
  const d=document.createElement("div"); d.textContent=text;
  if(cls) d.classList.add(cls);
  body.appendChild(d);
  if(body.children.length>20) body.removeChild(body.firstChild);
  body.scrollTop=body.scrollHeight;
}

function applyFilters(){
  const search = document.getElementById("searchInput").value.toLowerCase().trim();
  const status = document.getElementById("filterStatus").value;
  const danger = document.getElementById("filterDanger").value;
  const crime  = document.getElementById("filterCrime").value;

  const filtered = CRIMINAL_DB.filter(c=>{
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search) ||
      c.alias.toLowerCase().includes(search) ||
      c.id.toLowerCase().includes(search) ||
      c.lastLocation.toLowerCase().includes(search) ||
      c.crime.toLowerCase().includes(search);
    const matchStatus = status==="All" || c.status===status;
    const matchDanger = danger==="All" || c.dangerLevel===danger;
    const matchCrime  = crime==="All"  || c.crimeCode===crime;
    return matchSearch && matchStatus && matchDanger && matchCrime;
  });

  renderGrid(filtered);
}

/* ── Init ───────────────────────────────────── */
document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("filterStatus").addEventListener("change", applyFilters);
  document.getElementById("filterDanger").addEventListener("change", applyFilters);
  document.getElementById("filterCrime").addEventListener("change", applyFilters);

  commonInit(()=>{
    renderGrid(CRIMINAL_DB);
    animateStats();
    addTerminalLog("Criminal database loaded — 20 records","ok");
    addTerminalLog("Biometric module ready","ok");
  });
});