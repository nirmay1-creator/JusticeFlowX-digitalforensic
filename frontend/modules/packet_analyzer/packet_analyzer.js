const pcapBody = document.getElementById("pcapBody");
const treeView = document.getElementById("treeView");
const hexView = document.getElementById("hexView");
const loadBtn = document.getElementById("loadBtn");

// Removed mock protocol functions

function renderTable() {
  pcapBody.innerHTML = "";
  packets.forEach((p, index) => {
    const tr = document.createElement("tr");
    tr.className = "packet-row";
    
    let protoClass = "";
    if (p.proto === "TCP") protoClass = "proto-tcp";
    else if (p.proto === "UDP") protoClass = "proto-udp";
    else if (p.proto === "HTTP") protoClass = "proto-http";
    else if (p.proto === "DNS") protoClass = "proto-dns";
    else if (p.proto === "ICMP") protoClass = "proto-icmp";
    
    const d = new Date();
    const timeStr = d.getHours().toString().padStart(2, '0') + ':' + 
                    d.getMinutes().toString().padStart(2, '0') + ':' + 
                    d.getSeconds().toString().padStart(2, '0') + '.' + 
                    d.getMilliseconds().toString().padStart(3, '0');
    
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${timeStr}</td>
      <td>${p.src}</td>
      <td>${p.dst}</td>
      <td class="${protoClass}">${p.proto}</td>
      <td>${p.len}</td>
      <td>${p.info}</td>
    `;
    
    tr.addEventListener("click", () => {
      document.querySelectorAll(".packet-row").forEach(r => r.classList.remove("selected"));
      tr.classList.add("selected");
      showPacketDetails(p);
    });
    
    pcapBody.appendChild(tr);
  });
}

function showPacketDetails(p) {
  treeView.innerHTML = `
    <div class="tree-item">
      <div class="tree-item-title" onclick="this.nextElementSibling.classList.toggle('open')">
        <i class='bx bx-chevron-right'></i> Frame ${p.id}: ${p.len} bytes on wire
      </div>
      <div class="tree-children open">
        <div class="tree-leaf">Arrival Time: <strong>${new Date().toLocaleString()}</strong></div>
        <div class="tree-leaf">Frame Length: <strong>${p.len} bytes</strong></div>
        <div class="tree-leaf">Capture Length: <strong>${p.len} bytes</strong></div>
      </div>
    </div>
    <div class="tree-item">
      <div class="tree-item-title" onclick="this.nextElementSibling.classList.toggle('open')">
        <i class='bx bx-chevron-right'></i> Internet Protocol Version 4, Src: ${p.src}, Dst: ${p.dst}
      </div>
      <div class="tree-children open">
        <div class="tree-leaf">Version: <strong>4</strong></div>
        <div class="tree-leaf">Total Length: <strong>${p.len - 14}</strong></div>
        <div class="tree-leaf">Protocol: <strong>${p.proto}</strong></div>
        <div class="tree-leaf">Source: <strong>${p.src}</strong></div>
        <div class="tree-leaf">Destination: <strong>${p.dst}</strong></div>
      </div>
    </div>
  `;

  let hexLines = [];
  if (p.payload_hex) {
    const bytes = p.payload_hex.trim().split(" ");
    for (let i = 0; i < bytes.length; i += 16) {
      let offset = i.toString(16).padStart(4, '0');
      let hex = "";
      let ascii = "";
      for (let j = 0; j < 16; j++) {
        if (i + j < bytes.length) {
          let val = parseInt(bytes[i+j], 16);
          hex += bytes[i+j] + " ";
          ascii += (val > 31 && val < 127) ? String.fromCharCode(val) : ".";
        } else {
          hex += "   ";
          ascii += " ";
        }
      }
      hexLines.push(`<span class="hex-offset">${offset}</span>${hex}<span class="hex-ascii">${ascii.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`);
    }
  } else {
    hexLines.push("<span style='color:#777'>No payload data available.</span>");
  }
  hexView.innerHTML = hexLines.join("<br>");
}

// Initial load
async function loadRealPackets() {
  loadBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> LOADING...";
  try {
    const res = await fetch("http://localhost:8675/api/packet_history");
    const data = await res.json();
    packets = data.packets || [];
    renderTable();
    
    if (packets.length === 0) {
       pcapBody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding: 20px; color:#ff4d4d'>No packets found. Please start a Live Capture first!</td></tr>";
    }
  } catch(e) {
    console.error(e);
    pcapBody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding: 20px; color:#ff4d4d'>Error connecting to backend.</td></tr>";
  }
  loadBtn.innerHTML = "<i class='bx bx-folder-open'></i> REFRESH PCAP";
}

loadRealPackets();

loadBtn.addEventListener("click", loadRealPackets);

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
