/* =============================================

   JUSTICEFX – SHARED JS UTILITIES
   ============================================= */

/* ── Clock ─────────────────────────────────── */
function startClock() {
  const el = document.getElementById("clockDisplay");
  if (!el) return;
  const tick = () => el.textContent = new Date().toTimeString().slice(0,8);
  tick(); setInterval(tick, 1000);
}

/* ── Fake CPU ───────────────────────────────── */
function startCpuMeter() {
  const el = document.getElementById("cpuVal");
  if (!el) return;
  let base = 32;
  setInterval(() => {
    base = Math.max(10, Math.min(88, base + (Math.random()-0.5)*14));
    el.textContent = Math.round(base) + "%";
    el.style.color = base>72 ? "var(--red)" : base>50 ? "var(--warn)" : "var(--green)";
  }, 1900);
}

/* ── Marquee ────────────────────────────────── */
function startMarquee() {
  const el = document.getElementById("marqueeText");
  if (!el) return;
  el.textContent = "⬢ JUSTICEFX BIOMETRIC AUTHENTICATION LAYER 2 ACTIVE  ◆  DATABASE NODES 14/14 CONNECTED  ◆  LAST BREACH ATTEMPT: 72H AGO — NEUTRALIZED  ◆  NEXT AUDIT: 06:00 UTC  ◆  ALL SUBSYSTEMS NOMINAL  ◆  CRIMINAL RECORDS: 14,217  ◆  FACIAL MATCH ACCURACY: 99.7%";
}

/* ── Menu Dropdown ──────────────────────────── */
function initMenu() {
  const btn = document.getElementById("menuBtn");
  const dd  = document.getElementById("menuDropdown");
  if (!btn||!dd) return;
  btn.addEventListener("click", e => { e.stopPropagation(); dd.classList.toggle("show"); });
  document.addEventListener("click", () => dd.classList.remove("show"));
}

/* ── Logout ─────────────────────────────────── */
function initLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", e => {
    e.preventDefault();
    window.close();
    setTimeout(() => { alert("Session terminated. Close this tab."); }, 100);
  });
}

/* ── Hex Canvas ─────────────────────────────── */
function initHexCanvas() {
  const canvas = document.getElementById("hexCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
  resize(); window.addEventListener("resize", resize);

  const S = 34;
  const cols = Math.ceil(innerWidth/(S*1.75))+2;
  const rows = Math.ceil(innerHeight/(S*1.55))+2;
  const hexs = [];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++)
    hexs.push({ x:c*S*1.75+(r%2?S*0.875:0), y:r*S*1.55, phase:Math.random()*Math.PI*2, speed:0.002+Math.random()*0.005, lit:false, timer:0 });

  setInterval(() => {
    const h = hexs[Math.floor(Math.random()*hexs.length)];
    if(!h.lit){ h.lit=true; h.timer=55; }
  }, 160);

  const drawHex = (x,y,alpha,bright) => {
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a=(Math.PI/3)*i-Math.PI/6;
      i===0?ctx.moveTo(x+S*Math.cos(a),y+S*Math.sin(a)):ctx.lineTo(x+S*Math.cos(a),y+S*Math.sin(a));
    }
    ctx.closePath();
    ctx.strokeStyle = bright ? `rgba(0,245,255,${alpha*3})` : `rgba(0,175,195,${alpha})`;
    ctx.lineWidth = bright ? 1.1 : 0.55;
    ctx.stroke();
  };

  (function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    hexs.forEach(h=>{
      h.phase+=h.speed;
      const p = 0.038+Math.sin(h.phase)*0.03;
      if(h.lit){ h.timer--; if(h.timer<=0)h.lit=false; drawHex(h.x,h.y,p*4,true); }
      else drawHex(h.x,h.y,p,false);
    });
    requestAnimationFrame(animate);
  })();
}

/* ── Data Streams ───────────────────────────── */
function initDataStreams() {
  const c = document.getElementById("dataStreams");
  if(!c) return;
  for(let i=0;i<16;i++){
    const s=document.createElement("div"); s.className="data-stream";
    s.style.left=Math.random()*100+"vw";
    s.style.animationDuration=(6+Math.random()*14)+"s";
    s.style.animationDelay=(Math.random()*12)+"s";
    s.style.height=(80+Math.random()*200)+"px";
    c.appendChild(s);
  }
}

/* ── Particles ──────────────────────────────── */
function initParticles() {
  const colors=["#00f5ff","#7b2fff","#00ff88","#ffffff88"];
  for(let i=0;i<40;i++){
    const p=document.createElement("div"); p.className="particle";
    const sz=1.5+Math.random()*3;
    Object.assign(p.style,{ width:sz+"px", height:sz+"px", left:Math.random()*100+"vw",
      animationDuration:(12+Math.random()*24)+"s", animationDelay:(Math.random()*18)+"s",
      background:colors[Math.floor(Math.random()*colors.length)],
      boxShadow:`0 0 5px ${colors[Math.floor(Math.random()*colors.length)]}` });
    document.body.appendChild(p);
  }
}

/* ── Terminal ───────────────────────────────── */
function startTerminal() {
  const body=document.getElementById("terminalBody");
  const time=document.getElementById("termTime");
  if(!body) return;
  const logs=[
    {t:"Fingerprint module ping — 2ms",c:""},
    {t:"ALERT: Drone sector 7B activated",c:"alert"},
    {t:"Facial DB sync complete (14,217 records)",c:"ok"},
    {t:"Firewall scan — no anomalies",c:"ok"},
    {t:"ALERT: Unauthorized access blocked",c:"alert"},
    {t:"AI threat detection update pushed",c:""},
    {t:"Biometric reader — standby mode",c:""},
    {t:"WARN: Node 4C response degraded",c:"warn"},
    {t:"Encryption handshake verified",c:"ok"},
    {t:"Surveillance feed reconnected",c:"ok"},
    {t:"Case DB query completed (0.4ms)",c:""},
    {t:"WARN: CPU spike — 78% peak",c:"warn"},
    {t:"Memory pool optimized",c:"ok"},
    {t:"Auth attempt 192.168.1.44 — denied",c:"alert"},
  ];
  const add = ()=>{
    const l=logs[Math.floor(Math.random()*logs.length)];
    const d=document.createElement("div"); d.textContent=l.t;
    if(l.c) d.classList.add(l.c);
    body.appendChild(d);
    if(body.children.length>20) body.removeChild(body.firstChild);
    body.scrollTop=body.scrollHeight;
  };
  setInterval(add,1700);
  if(time) setInterval(()=>time.textContent=new Date().toTimeString().slice(0,8),1000);
}

/* ── Stat Counter ───────────────────────────── */
function animateStats() {
  document.querySelectorAll(".stat-val").forEach(el=>{
    const target=parseFloat(el.dataset.count);
    const isF=target%1!==0;
    const start=performance.now();
    const dur=1900;
    const update=now=>{
      const p=Math.min((now-start)/dur,1);
      const e=1-Math.pow(1-p,3);
      el.textContent=isF?(target*e).toFixed(1):Math.round(target*e);
      if(p<1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

/* ── Boot Sequence ──────────────────────────── */
function runBootSequence(onComplete) {
  const ov=document.createElement("div"); ov.id="bootOverlay";
  ov.innerHTML=`
    <div class="boot-logo">JusticeFlowX</div>
    <div class="boot-sub">BIOMETRIC VERIFICATION SYSTEM v2.4</div>
    <div class="boot-bar-wrap"><div class="boot-bar-fill" id="bpf"></div></div>
    <div id="bootLog"></div>
  `;
  document.body.appendChild(ov);
  const log=ov.querySelector("#bootLog");
  const fill=ov.querySelector("#bpf");
  const msgs=[
    {t:"Kernel handshake complete",c:"ok"},
    {t:"Initializing biometric subsystem...",c:""},
    {t:"Fingerprint module — ONLINE",c:"ok"},
    {t:"Facial recognition engine — ONLINE",c:"ok"},
    {t:"Syncing criminal database [14,217 records]...",c:""},
    {t:"Database sync complete",c:"ok"},
    {t:"Encryption layer — 256-bit AES active",c:"ok"},
    {t:"Threat detection module updated",c:"ok"},
    {t:"All systems nominal — READY",c:"ok"},
  ];
  let i=0;
  const iv=setInterval(()=>{
    if(i<msgs.length){
      const d=document.createElement("div"); d.textContent=msgs[i].t;
      if(msgs[i].c) d.classList.add(msgs[i].c);
      log.appendChild(d); log.scrollTop=99999;
      fill.style.width=((i+1)/msgs.length*100)+"%";
      i++;
    } else {
      clearInterval(iv);
      setTimeout(()=>{
        ov.style.transition="opacity 0.55s ease"; ov.style.opacity="0";
        setTimeout(()=>{ ov.remove(); onComplete(); },600);
      },350);
    }
  },360);
}

/* ── Access Popup ───────────────────────────── */
function showAccessPopup(granted, cb) {
  const p=document.createElement("div");
  p.className="access-popup"+(granted?" granted":" denied");
  p.innerHTML=`<span class="popup-icon">${granted?"✓":"✕"}</span>${granted?"ACCESS GRANTED":"ACCESS DENIED"}<span class="popup-sub">${granted?"IDENTITY VERIFIED":"AUTHENTICATION FAILED"}</span>`;
  document.body.appendChild(p);
  setTimeout(()=>p.classList.add("show"),50);
  setTimeout(()=>p.classList.remove("show"),2800);
  setTimeout(()=>{ p.remove(); if(granted&&cb) cb(); },3200);
}

/* ── Brand Glitch ───────────────────────────── */
function initBrandGlitch() {
  const b=document.querySelector(".brand");
  if(!b) return;
  setInterval(()=>{
    b.style.transform=`translate(${(Math.random()-0.5)*3}px,${(Math.random()-0.5)*2}px)`;
    b.style.filter=`hue-rotate(${Math.random()*28}deg)`;
    setTimeout(()=>{ b.style.transform=""; b.style.filter=""; },95);
  },3200);
}

/* ── Common Init ────────────────────────────── */
function commonInit(onReady) {
  initHexCanvas();
  initDataStreams();
  initParticles();
  runBootSequence(()=>{
    startClock();
    startCpuMeter();
    startMarquee();
    initBrandGlitch();
    initMenu();
    initLogout();
    startTerminal();
    animateStats();
    if(onReady) onReady();
  });
}