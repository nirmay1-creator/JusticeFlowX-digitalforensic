/* =============================================
   SYSTEM HEALTH PAGE JS (REAL BACKEND)
   ============================================= */

const API_URL = "http://localhost:8001/api/system";

function setMeter(id, pct){
  const el = document.getElementById(id);
  if(!el) return;
  el.style.width = Math.max(0,Math.min(100,pct))+"%";
}

function setVal(id, val, unit=""){
  const el=document.getElementById(id);
  if(el) el.textContent=val+(unit||"");
}

function colorVal(id, val, warnAt=60, alertAt=80){
  const el=document.getElementById(id);
  if(!el) return;
  el.className = "health-card-value" + (val>=alertAt?" alert":val>=warnAt?" warn":" ok");
}

async function fetchStatus() {
  try {
    const res = await fetch(`${API_URL}/status`);
    const data = await res.json();
    updateMetrics(data);
  } catch (err) {
    console.error("Failed to fetch system status from backend", err);
  }
}

function updateMetrics(data){
  const btn=document.getElementById("powerBtn");
  const label=document.getElementById("sysStatusLabel");

  if(!data.power){
    btn.innerHTML=`<i class='bx bx-power-off'></i> POWER ON`;
    label.textContent="OFFLINE";
    label.style.color="var(--red)";
    
    // Zero out all meters
    ["cpuMeterFill","memMeterFill","diskMeterFill","netMeterFill","dbMeterFill"].forEach(id=>setMeter(id,0));
    ["cpuDisplay","memDisplay","diskDisplay"].forEach(id=>setVal(id,"0%"));
    setVal("netDisplay","OFFLINE"); setVal("dbDisplay","OFFLINE");
    setVal("secDisplay","OFFLINE");
    return;
  }
  
  btn.innerHTML=`<i class='bx bx-power-off'></i> SHUTDOWN`;
  label.textContent="SYSTEMS ONLINE";
  label.style.color="var(--green)";

  const hw = data.metrics.hardware;

  // CPU
  const cpu = Math.round(hw.cpu.usage);
  setVal("cpuDisplay",cpu,"%"); setMeter("cpuMeterFill",cpu); colorVal("cpuDisplay",cpu);
  setVal("cpuVal",cpu,"%");
  setVal("cpuThreads",hw.cpu.threads);
  setVal("cpuClock",hw.cpu.clock,"GHz");
  setVal("cpuTemp",hw.cpu.temp,"°C");
  setVal("cpuLoad",hw.cpu.load_avg);

  // Memory
  const memPct = Math.round(hw.memory.percent);
  setVal("memDisplay",memPct,"%"); setMeter("memMeterFill",memPct); colorVal("memDisplay",memPct,60,85);
  setVal("memUsed",hw.memory.used_gb,"GB"); 
  setVal("memFree",hw.memory.free_gb,"GB");
  setVal("memCached",hw.memory.cached_gb,"GB"); 
  setVal("memSwap",hw.memory.swap_gb,"GB");

  // Disk
  const disk = Math.round(hw.disk.percent);
  setVal("diskDisplay",disk,"%"); setMeter("diskMeterFill",disk); colorVal("diskDisplay",disk,75,90);
  setVal("diskRead",hw.disk.read_mbs,"MB/s"); 
  setVal("diskWrite",hw.disk.write_mbs,"MB/s");
  setVal("diskFree",hw.disk.free_tb,"TB"); 
  setVal("diskIOPS",hw.disk.iops);

  // Network
  const netPct = Math.min(100, Math.round((hw.network.download_mbps / 1000) * 100)); // Simulated capacity
  setMeter("netMeterFill",netPct);
  setVal("netUp",hw.network.upload_mbps,"Mbps");
  setVal("netDown",hw.network.download_mbps,"Mbps");
  setVal("netLatency",hw.network.latency,"ms");
  setVal("netUptime",hw.network.uptime_str);

  // DB
  setVal("dbQuery", Math.floor(Math.random() * 12 + 1) + "ms"); // fake DB latency
  setVal("dbSync",new Date().toTimeString().slice(0,8));
  const nodes = data.threat_mode ? Math.floor(Math.random()*4+10) : 14;
  setVal("dbNodes",nodes+"/14");

  // Security
  const threatBtn = document.getElementById("threatBtn");
  const sec = document.getElementById("secDisplay");
  const dot = document.getElementById("threatDot");
  const lvl = document.getElementById("threatLevel");

  if(data.threat_mode){
    document.body.style.setProperty("--border","rgba(255,43,94,0.3)");
    threatBtn.textContent="⚠ DEACTIVATE THREAT MODE";
    sec.textContent="THREAT DETECTED";
    sec.className="health-card-value alert";
    dot.className="sec-dot bad";
    lvl.textContent="HIGH"; lvl.className="sec-status bad";
    document.body.style.boxShadow="inset 0 0 0 3px rgba(255,43,94,0.5)";
  } else {
    document.body.style.removeProperty("--border");
    threatBtn.innerHTML=`<i class='bx bx-alarm'></i> THREAT MODE`;
    document.body.style.boxShadow="";
    
    sec.textContent="SECURE";
    sec.className="health-card-value ok";
    dot.className="sec-dot ok";
    lvl.textContent="LOW";
    lvl.className="sec-status ok";
  }
}

async function toggleThreat(){
  await fetch(`${API_URL}/toggle_threat`, { method: "POST" });
  fetchStatus();
}

async function toggleSystem(){
  await fetch(`${API_URL}/toggle_power`, { method: "POST" });
  fetchStatus();
}

// Bind buttons
document.getElementById("threatBtn").onclick = toggleThreat;
document.getElementById("powerBtn").onclick = toggleSystem;

document.addEventListener("DOMContentLoaded",()=>{
  commonInit(()=>{
    fetchStatus();
    setInterval(fetchStatus, 2000);
  });
});