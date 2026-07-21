const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const packetTable = document.getElementById("packetTableBody");

const valPackets = document.getElementById("valPackets");
const valBandwidth = document.getElementById("valBandwidth");
const valAlerts = document.getElementById("valAlerts");
const valDropped = document.getElementById("valDropped");

let captureInterval = null;
let packets = 0;
let alerts = 0;
let totalBytes = 0;

function appendPacketRow(pkt) {
  let rowClass = "";
  if (pkt.proto === "ICMP") rowClass = "warn";
  
  // Simulate an alert for large packets or specific anomalies
  if (pkt.len > 1400) {
    rowClass = "alert";
    alerts++;
    valAlerts.textContent = alerts;
    if (!pkt.info.includes("[MALFORMED]")) {
      pkt.info = "[LARGE PAYLOAD] " + pkt.info;
    }
  }

  const tr = document.createElement("tr");
  tr.className = `packet-row ${rowClass}`;
  
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                  now.getMinutes().toString().padStart(2, '0') + ':' + 
                  now.getSeconds().toString().padStart(2, '0') + '.' + 
                  now.getMilliseconds().toString().padStart(3, '0');
  tr.innerHTML = `
    <td>${timeStr}</td>
    <td>${pkt.src}</td>
    <td>${pkt.dst}</td>
    <td>${pkt.proto}</td>
    <td>${pkt.len}</td>
    <td>${pkt.info || 'Application Data'}</td>
  `;
  
  packetTable.insertBefore(tr, packetTable.firstChild);
  if (packetTable.children.length > 50) {
    packetTable.removeChild(packetTable.lastChild);
  }
}

async function fetchPackets() {
  try {
    const res = await fetch("http://localhost:8675/api/get_packets");
    const data = await res.json();
    
    if (data.status === "error") {
      alert("Capture Error: " + data.error + "\n\nTry running the backend with Administrator/root privileges.");
      document.getElementById("stopBtn").click();
      return;
    }

    if (data.status === "success") {
      if (data.packets && data.packets.length > 0) {
        data.packets.forEach(pkt => {
          appendPacketRow(pkt);
          totalBytes += pkt.len;
        });
      }
      
      packets = data.total;
      valPackets.textContent = packets;
      
      // Calculate rough bandwidth (Mbps) based on bytes received in this 1s interval
      const bandwidthMbps = (totalBytes * 8) / 1000000;
      valBandwidth.textContent = bandwidthMbps.toFixed(2);
      totalBytes = 0; // reset for next interval
    }
  } catch (err) {
    console.error("Error fetching packets:", err);
  }
}

startBtn.addEventListener("click", async () => {
  const iface = document.getElementById("interfaceSelect").value;
  const bpfFilter = document.getElementById("bpfFilter").value;

  try {
    await fetch("http://localhost:8675/api/start_capture", {
      method: "POST",
      body: JSON.stringify({ interface: iface, filter: bpfFilter })
    });
    
    startBtn.style.display = "none";
    stopBtn.style.display = "block";
    
    // Poll for new packets every 1 second
    captureInterval = setInterval(fetchPackets, 1000);
  } catch (err) {
    alert("Backend not running. Please start app.py first!");
  }
});

stopBtn.addEventListener("click", async () => {
  try {
    await fetch("http://localhost:8675/api/stop_capture", { method: "POST" });
  } catch(e) {}
  
  stopBtn.style.display = "none";
  startBtn.style.display = "block";
  clearInterval(captureInterval);
});

// Check if already sniffing on page load
async function checkStatusOnLoad() {
  try {
    const res = await fetch("http://localhost:8675/api/status");
    const data = await res.json();
    if (data.sniffing) {
      // Backend is already running, restore UI state
      startBtn.style.display = "none";
      stopBtn.style.display = "block";
      packets = data.total;
      valPackets.textContent = packets;
      captureInterval = setInterval(fetchPackets, 1000);
    }
  } catch (err) {
    console.error("Backend not reachable", err);
  }
}
checkStatusOnLoad();

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
