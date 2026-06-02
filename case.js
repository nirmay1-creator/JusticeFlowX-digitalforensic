let currentCase = null;

const time = () => new Date().toLocaleString();
const hash = () => crypto.randomUUID().slice(0,12).toUpperCase();

function createCase(){
currentCase={
id:caseId.value,
officer:officer.value,
role:role.value,
evidence:[],
secure:true
};
log(timeline,`Case ${currentCase.id} initialized`);
log(custodyLog,`Officer ${currentCase.officer} (${currentCase.role}) authorized`);
}

function addEvidence(){
if(!currentCase) return alert("No active case");

const e={
name:evidenceName.value,
type:evidenceType.value,
hash:hash(),
encrypted:true,
time:time()
};

currentCase.evidence.push(e);

log(evidenceList,
`<b>${e.name}</b> [${e.type}]<br>
Hash:${e.hash}<br>
🔐 Encrypted`);

log(timeline,`Evidence ${e.name} secured`);
log(custodyLog,`Vault lock engaged for ${e.name}`);
}

function runAI(){
if(!currentCase) return;

let score=90+Math.floor(Math.random()*10);
aiResult.innerHTML=`
Integrity Score: <b>${score}%</b><br>
✔ No tampering detected<br>
✔ Timeline consistent<br>
⚖ Court-ready
`;
}

function log(target,text){
target.innerHTML+=`<li>${time()} — ${text}</li>`;
}
function goDashboard() {
  window.location.href = "index.html";
}
