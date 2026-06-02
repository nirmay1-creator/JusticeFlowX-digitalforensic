/* =============================================
   SYSTEM HEALTH PAGE JS
   ============================================= */

let systemOn = true;
let threatMode = false;
let startTime = Date.now();

function rnd(min, max){ return Math.random()*(max-min)+min; }
function ri(min, max){ return Math.floor(rnd(min,max)); }

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

function updateMetrics(){
  if(!systemOn) return;

  // CPU
  const cpu=ri(18,88);
  setVal("cpuDisplay",cpu,"%"); setMeter("cpuMeterFill",cpu); colorVal("cpuDisplay",cpu);
  setVal("cpuVal",cpu,"%");
  setVal("cpuThreads",ri(8,32));
  setVal("cpuClock",(rnd(2.4,5.2)).toFixed(1),"GHz");
  setVal("cpuTemp",ri(38,82),"°C");
  setVal("cpuLoad",(rnd(0.3,3.5)).toFixed(2));

  // Memory
  const memUsed=ri(8,28); const memTotal=32;
  const memPct=Math.round(memUsed/memTotal*100);
  setVal("memDisplay",memPct,"%"); setMeter("memMeterFill",memPct); colorVal("memDisplay",memPct,55,75);
  setVal("memUsed",memUsed,"GB"); setVal("memFree",(memTotal-memUsed)+"GB");
  setVal("memCached",ri(2,8),"GB"); setVal("memSwap",ri(0,4),"GB");

  // Disk
  const disk=ri(15,75);
  setVal("diskDisplay",disk,"%"); setMeter("diskMeterFill",disk); colorVal("diskDisplay",disk,60,80);
  setVal("diskRead",ri(80,550),"MB/s"); setVal("diskWrite",ri(60,400),"MB/s");
  setVal("diskFree",ri(4,18),"TB"); setVal("diskIOPS",ri(200,4000));

  // Network
  const netPct=ri(20,85);
  setMeter("netMeterFill",netPct);
  setVal("netUp",(rnd(10,400)).toFixed(1),"Mbps");
  setVal("netDown",(rnd(50,900)).toFixed(1),"Mbps");
  setVal("netLatency",ri(1,12),"ms");
  const upHours=Math.floor((Date.now()-startTime)/3600000);
  const upMins=Math.floor(((Date.now()-startTime)%3600000)/60000);
  setVal("netUptime",upHours+"h "+upMins+"m");

  // DB
  setVal("dbQuery",ri(1,12)+"ms");
  setVal("dbSync",new Date().toTimeString().slice(0,8));
  const nodes=threatMode?ri(10,14):14;
  setVal("dbNodes",nodes+"/14");

  // Security
  if(!threatMode){
    document.getElementById("secDisplay").textContent="SECURE";
    document.getElementById("secDisplay").className="health-card-value ok";
    document.getElementById("threatDot").className="sec-dot ok";
    document.getElementById("threatLevel").textContent="LOW";
    document.getElementById("threatLevel").className="sec-status ok";
  }
}

function toggleThreat(){
  threatMode=!threatMode;
  const btn=document.getElementById("threatBtn");
  const status=document.getElementById("threatStatus");
  const sec=document.getElementById("secDisplay");
  const dot=document.getElementById("threatDot");
  const lvl=document.getElementById("threatLevel");

  if(threatMode){
    document.body.style.setProperty("--border","rgba(255,43,94,0.3)");
    btn.textContent="⚠ DEACTIVATE THREAT MODE";
    status.textContent="⚠ THREAT MODE ACTIVE";
    status.style.color="var(--red)";
    sec.textContent="THREAT DETECTED";
    sec.className="health-card-value alert";
    dot.className="sec-dot bad";
    lvl.textContent="HIGH"; lvl.className="sec-status bad";
    // Red overlay pulse
    document.body.style.boxShadow="inset 0 0 0 3px rgba(255,43,94,0.5)";
  } else {
    document.body.style.removeProperty("--border");
    btn.innerHTML=`<i class='bx bx-alarm'></i> THREAT MODE`;
    status.textContent="";
    document.body.style.boxShadow="";
    updateMetrics();
  }
}

function toggleSystem(){
  systemOn=!systemOn;
  const btn=document.getElementById("powerBtn");
  const label=document.getElementById("sysStatusLabel");
  if(!systemOn){
    btn.innerHTML=`<i class='bx bx-power-off'></i> POWER ON`;
    label.textContent="OFFLINE";
    label.style.color="var(--red)";
    // Zero out all meters
    ["cpuMeterFill","memMeterFill","diskMeterFill","netMeterFill","dbMeterFill"].forEach(id=>setMeter(id,0));
    ["cpuDisplay","memDisplay","diskDisplay"].forEach(id=>setVal(id,"0%"));
    setVal("netDisplay","OFFLINE"); setVal("dbDisplay","OFFLINE");
    setVal("secDisplay","OFFLINE");
  } else {
    btn.innerHTML=`<i class='bx bx-power-off'></i> SHUTDOWN`;
    label.textContent="SYSTEMS ONLINE";
    label.style.color="var(--green)";
    updateMetrics();
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  commonInit(()=>{
    updateMetrics();
    setInterval(updateMetrics, 2200);
  });
});