const scanBtn = document.getElementById("scanBtn");
const targetIp = document.getElementById("targetIp");
const resultsPanel = document.getElementById("resultsPanel");
const loadingOverlay = document.getElementById("loadingOverlay");

const scoreCircle = document.getElementById("scoreCircle");
const scoreVal = document.getElementById("scoreVal");
const targetName = document.getElementById("targetName");
const targetNotes = document.getElementById("targetNotes");
const resLocation = document.getElementById("resLocation");
const resAsn = document.getElementById("resAsn");
const resAliases = document.getElementById("resAliases");
const resLastSeen = document.getElementById("resLastSeen");
const portsList = document.getElementById("portsList");

scanBtn.addEventListener("click", async () => {
  const ip = targetIp.value;
  if (!ip) return;
  
  resultsPanel.classList.add("visible");
  loadingOverlay.style.display = "flex";
  
  try {
    const res = await fetch("http://localhost:8675/api/threat_intel", {
      method: "POST",
      body: JSON.stringify({ ip: ip })
    });
    const data = await res.json();
    
    loadingOverlay.style.display = "none";
    populateResults(data);
  } catch (err) {
    loadingOverlay.style.display = "none";
    alert("Backend not running. Please start app.py first!");
  }
});

function populateResults(data) {
  scoreVal.textContent = data.score;
  targetName.textContent = data.ip;
  
  if (data.malicious) {
    scoreCircle.classList.add("danger");
    targetNotes.style.color = "var(--red)";
  } else {
    scoreCircle.classList.remove("danger");
    targetNotes.style.color = "var(--green)";
  }
  
  targetNotes.textContent = data.notes;
  resLocation.textContent = data.location;
  resAsn.textContent = data.asn;
  resAliases.textContent = data.malicious ? "Known Compromised Node" : "None Known";
  resLastSeen.textContent = "Live Scan";
  
  // Real ports from backend
  portsList.innerHTML = "";
  if (data.ports && data.ports.length > 0) {
    data.ports.forEach(p => {
      const stateTxt = p.state.toUpperCase();
      const div = document.createElement("div");
      div.className = `port-item ${p.state}`;
      div.innerHTML = `<span>PORT ${p.port} (${p.service})</span> <strong>${stateTxt}</strong>`;
      portsList.appendChild(div);
    });
  } else {
    portsList.innerHTML = "<div style='color:#666'>No common ports open.</div>";
  }
}

// Clock
setInterval(() => {
  const el = document.getElementById("clockDisplay");
  if (el) el.textContent = new Date().toTimeString().slice(0, 8);
}, 1000);

// Hex Canvas Background
const canvas = document.getElementById("hexCanvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener("resize", resize);
  const S = 30;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let r=0;r<20;r++){
      for(let c=0;c<40;c++){
        let x = c*S*1.75 + (r%2===0?0:S*0.875);
        let y = r*S*1.55;
        ctx.beginPath();
        for(let i=0;i<6;i++){
          let a = (Math.PI/3)*i - Math.PI/6;
          i===0?ctx.moveTo(x+S*Math.cos(a), y+S*Math.sin(a)):ctx.lineTo(x+S*Math.cos(a), y+S*Math.sin(a));
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(0,245,255,0.05)`;
        ctx.stroke();
      }
    }
  }
  draw();
}
