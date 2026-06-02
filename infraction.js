const logFeed = document.getElementById("logFeed");
const sysStatus = document.getElementById("sysStatus");
const cells = document.querySelectorAll(".grid .cell");
const alertBtn = document.querySelector(".alertBtn");
const powerBtn = document.querySelector(".powerBtn");

let systemOn = true;
let threatMode = false;
let logInterval;

const logs = [
  "🟢 Camera C-34 tracking subject ID 89421",
  "🟡 Drone D2 scanning Sector 7B",
  "🟢 Facial match completed (Accuracy: 98.3%)",
  "🔵 Fingerprint verification successful",
  "🟢 Criminal database synced",
  "🟡 Server backup in progress",
  "🔴 Unauthorized access attempt blocked",
  "🟢 AI threat model updated",
  "🟡 Network latency spike detected",
  "🟢 Perimeter sensors recalibrated"
];

const details = {
  cctv: { title: "CCTV Network", body: "Total Cameras: 124<br>Active: 121<br>Offline: 3<br>Last Alert: 10:45 PM" },
  drone: { title: "Drone Fleet", body: "Total Units: 4<br>Active: 2<br>Charging: 1<br>Maintenance: 1<br>Last Flight: 9:30 PM" },
  server: { title: "Server Cluster", body: "CPU: 68%<br>RAM: 71%<br>Free Storage: 12TB<br>Network Load: 45%" },
  fingerprint: { title: "Fingerprint System", body: "Records Indexed: 1.4M<br>Matches Today: 312<br>Errors: 2" },
  face: { title: "Facial Recognition", body: "Faces Stored: 2.8M<br>Accuracy: 98.3%<br>Matches Today: 521" },
  criminal: { title: "Criminal Records", body: "Total Profiles: 782,450<br>New Today: 14<br>Alerts: 3 High Risk" }
};

// ================= LOGS =================
function startLogs() {
  clearInterval(logInterval);
  logInterval = setInterval(() => {
    const div = document.createElement("div");
    div.className = "log";
    div.textContent = logs[Math.floor(Math.random() * logs.length)];
    logFeed.prepend(div);
    if (logFeed.children.length > 10) logFeed.removeChild(logFeed.lastChild);

    const activeCells = [...cells].filter(c => c.classList.contains("active"));
    if (activeCells.length) {
      const cell = activeCells[Math.floor(Math.random() * activeCells.length)];
      cell.style.animation = "cellPulse 1s";
      setTimeout(() => (cell.style.animation = ""), 1000);
    }
  }, 2000);
}

// ================= SYSTEM =================
function toggleSystem() {
  systemOn = !systemOn;

  if (!systemOn) {
    threatMode = false;
    document.body.classList.remove("alert");
    alertBtn.classList.remove("threat-active");

    sysStatus.textContent = "OFFLINE";
    sysStatus.className = "offline";
    document.body.classList.add("system-off");
    clearInterval(logInterval);
    logFeed.innerHTML = "";
  } else {
    sysStatus.textContent = "ONLINE";
    sysStatus.className = "online";
    document.body.classList.remove("system-off");
    startLogs();
  }
}

// ================= THREAT =================
function toggleAlert() {
  if (!systemOn) return;

  threatMode = !threatMode;
  document.body.classList.toggle("alert", threatMode);
  alertBtn.classList.toggle("threat-active", threatMode);

  if (threatMode) {
    sysStatus.textContent = "THREAT MODE";
    sysStatus.style.color = "red";
    document.querySelectorAll(".card").forEach(c => {
      c.style.boxShadow = "0 0 35px red, 0 0 55px red inset";
      c.style.transform = "scale(1.05)";
    });
    spawnThreatParticles();
  } else {
    sysStatus.textContent = "ONLINE";
    sysStatus.style.color = "lime";
    document.querySelectorAll(".card").forEach(c => {
      c.style.boxShadow = "0 0 20px cyan, 0 0 40px cyan inset";
      c.style.transform = "scale(1)";
    });
    removeThreatParticles();
  }
}

// ================= PARTICLES =================
function spawnThreatParticles() {
  removeThreatParticles();
  for (let i = 0; i < 80; i++) {
    const p = document.createElement("div");
    p.className = "threat-particle";
    p.style.left = Math.random() * window.innerWidth + "px";
    p.style.animationDuration = 3 + Math.random() * 4 + "s";
    document.body.appendChild(p);
  }
}

function removeThreatParticles() {
  document.querySelectorAll(".threat-particle").forEach(p => p.remove());
}

// ================= MODAL =================
function openModal(type) {
  document.getElementById("modalTitle").innerHTML = details[type].title;
  document.getElementById("modalBody").innerHTML = details[type].body;
  document.getElementById("detailModal").style.display = "flex";
}
function closeModal() {
  document.getElementById("detailModal").style.display = "none";
}

// ================= INIT =================
startLogs();
document.getElementById("camBar").style.width = "98%";
document.getElementById("droneBar").style.width = "90%";
document.getElementById("serverBar").style.width = "68%";

alertBtn.onclick = toggleAlert;
powerBtn.onclick = toggleSystem;
