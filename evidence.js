// ELEMENT REFERENCES
const vault = document.getElementById("vaultList");
const aiStatus = document.getElementById("aiStatus");
const aiMeter = document.getElementById("aiMeter");
const previewModal = document.getElementById("previewModal");
const previewContent = document.getElementById("previewContent");
const evName = document.getElementById("evName");
const evType = document.getElementById("evType");
const roleSelect = document.getElementById("roleSelect");

// ------------------
// PAGE LOAD INIT
// ------------------
window.onload = () => {
  previewModal.style.display = "none"; // hide modal initially
  aiMeter.style.width = "0%";
  aiStatus.innerText = "🟡 Awaiting AI scan...";
};

// ------------------
// HASH GENERATOR
// ------------------
function generateHash(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16);
}

// ------------------
// UPLOAD EVIDENCE
// ------------------
function uploadEvidence() {
  const name = evName.value.trim();
  const type = evType.value;
  const role = roleSelect.value;

  if (!name) return alert("Enter evidence name");

  const hash = generateHash(name);

  const item = document.createElement("div");
  item.className = "vault-item";
  item.dataset.type = type;
  item.dataset.role = role;
  item.dataset.hash = hash;
  item.innerHTML = `<strong>${name}</strong><br>${type}<br>${hash}`;

  // click to preview
  item.onclick = () => openPreview(item);

  vault.appendChild(item);

  // reset form
  evName.value = "";
}

// ------------------
// AI SCAN SIMULATION
// ------------------
function runAI() {
  aiStatus.innerText = "🌀 Scanning evidence integrity...";
  aiMeter.style.width = "0%";

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 15);
    if (progress >= 100) progress = 100;
    aiMeter.style.width = progress + "%";

    if (progress === 100) {
      clearInterval(interval);
      aiStatus.innerText = "✅ Evidence verified | No tampering detected";
    }
  }, 400);
}

// ------------------
// PREVIEW MODAL
// ------------------
function openPreview(item) {
  previewContent.innerHTML = `<h3 style="color:#00ffff">${item.innerHTML}</h3>`;
  previewModal.style.display = "flex";
}

function closePreview() {
  previewModal.style.display = "none";
}

// Close modal when clicking outside content
previewModal.addEventListener("click", (e) => {
  if (e.target === previewModal) closePreview();
});

// Close modal with ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePreview();
});
function goDashboard() {
  window.location.href = "index.html";
}
