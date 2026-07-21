const API_URL = "http://localhost:8001/api/system";

const sysBadge = document.getElementById("sysBadge");
const sysStatusText = document.getElementById("sysStatusText");
const logFeed = document.getElementById("logFeed");
let pollingInterval;

async function fetchStatus() {
  try {
    const res = await fetch(`${API_URL}/status`);
    const data = await res.json();
    updateUI(data);
  } catch (err) {
    console.error("Failed to fetch status", err);
  }
}

async function fetchLogs() {
  try {
    const res = await fetch(`${API_URL}/logs`);
    const data = await res.json();
    renderLogs(data.logs);
  } catch (err) {
    console.error("Failed to fetch logs", err);
  }
}

function updateUI(data) {
  if (!data.power) {
    document.body.classList.add("system-offline");
    document.body.classList.remove("threat-active");
    sysBadge.style.borderColor = "var(--infra-off)";
    sysBadge.style.color = "var(--infra-off)";
    sysBadge.innerHTML = `<i class='bx bx-power-off'></i> <span id="sysStatusText">SYSTEM OFFLINE</span>`;
    
    // reset metrics
    ["cctvVal","droneVal","serverVal","fingerVal","faceVal","crimeVal"].forEach(id => {
      document.getElementById(id).innerText = "OFFLINE";
    });
    ["cctvBar","droneBar","serverBar"].forEach(id => {
      document.getElementById(id).style.width = "0%";
    });
    return;
  }

  document.body.classList.remove("system-offline");
  
  if (data.threat_mode) {
    document.body.classList.add("threat-active");
    sysBadge.style.borderColor = "var(--infra-alert)";
    sysBadge.style.color = "var(--infra-alert)";
    sysBadge.innerHTML = `<i class='bx bx-error'></i> <span id="sysStatusText">THREAT DETECTED</span>`;
  } else {
    document.body.classList.remove("threat-active");
    sysBadge.style.borderColor = "#00d4ff";
    sysBadge.style.color = "#00d4ff";
    sysBadge.innerHTML = `<i class='bx bx-check-circle'></i> <span id="sysStatusText">SYSTEM ONLINE</span>`;
  }

  const m = data.metrics;
  if (!m) return;

  document.getElementById("cctvVal").innerText = `${m.cctv.active}/${m.cctv.total}`;
  document.getElementById("cctvBar").style.width = `${(m.cctv.active/m.cctv.total)*100}%`;

  document.getElementById("droneVal").innerText = `${m.drone.active}/${m.drone.total}`;
  document.getElementById("droneBar").style.width = `${(m.drone.active/m.drone.total)*100}%`;

  document.getElementById("serverVal").innerText = `${m.server.cpu}%`;
  document.getElementById("serverBar").style.width = `${m.server.cpu}%`;

  document.getElementById("fingerVal").innerText = m.fingerprint.indexed;
  document.getElementById("faceVal").innerText = m.face.stored;
  document.getElementById("crimeVal").innerText = m.criminal.profiles;
}

function renderLogs(logs) {
  if (!logs) return;
  // Clear feed
  logFeed.innerHTML = "";
  
  logs.forEach(log => {
    const div = document.createElement("div");
    div.className = "log-line";
    
    // Determine class based on content
    if (log.message.includes("🔴")) div.classList.add("critical");
    else if (log.message.includes("🟡")) div.classList.add("warn");
    else div.classList.add("normal");

    div.innerHTML = `<span class="timestamp">[${log.timestamp}]</span> ${log.message}`;
    logFeed.appendChild(div);
  });
}

async function togglePower() {
  await fetch(`${API_URL}/toggle_power`, { method: "POST" });
  fetchStatus();
  fetchLogs();
}

async function toggleThreat() {
  await fetch(`${API_URL}/toggle_threat`, { method: "POST" });
  fetchStatus();
}

// Init
fetchStatus();
fetchLogs();
pollingInterval = setInterval(() => {
  fetchStatus();
  fetchLogs();
}, 2000);
