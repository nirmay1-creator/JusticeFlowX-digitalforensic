const API_URL = "http://127.0.0.1:8001/api/justicegpt";

let currentMode = "general";
let uploadedFile = null;
let currentChatId = null; // Will support sessions later
let filesAnalyzedCount = 245;

document.addEventListener("DOMContentLoaded", () => {
  initHexCanvas();
  setupModeSelection();
  setupChatInterface();
  setupFileUpload();
  setupQuickActions();
  if (typeof startClock === 'function') startClock();
});

// ======================= CANVAS BACKGROUND =======================
function initHexCanvas() {
  const canvas = document.getElementById("jgptCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener("resize", resize);
  
  const hexSize = 40;
  const hexagons = [];
  const cols = Math.ceil(canvas.width / (hexSize * 1.5)) + 1;
  const rows = Math.ceil(canvas.height / (hexSize * 1.5)) + 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      hexagons.push({
        x: c * hexSize * 1.732 + (r % 2 === 0 ? 0 : hexSize * 0.866),
        y: r * hexSize * 1.5,
        pulsePhase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.01
      });
    }
  }

  function drawHex(x, y, size, alpha) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(0, 150, 255, ${alpha})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexagons.forEach(h => {
      h.pulsePhase += h.speed;
      const alpha = 0.02 + Math.sin(h.pulsePhase) * 0.03;
      drawHex(h.x, h.y, hexSize - 2, Math.max(0, alpha));
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// ======================= MODES =======================
function setupModeSelection() {
  const btns = document.querySelectorAll('.mode-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.getAttribute('data-mode');
    });
  });
}

// ======================= CHAT LOGIC =======================
const chatContainer = document.getElementById('chatContainer');
const chatMessages = document.getElementById('chatMessages');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

function setupChatInterface() {
  // Auto-resize textarea
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);
}

function createMessageElement(sender, content, isHtml = false) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${sender}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = sender === 'user' ? "<i class='bx bx-user'></i>" : "<i class='bx bx-brain'></i>";
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'msg-content';
  
  if (isHtml) {
    contentDiv.innerHTML = content;
  } else {
    contentDiv.textContent = content;
  }
  
  msgDiv.appendChild(avatar);
  msgDiv.appendChild(contentDiv);
  return msgDiv;
}

function showTypingIndicator() {
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ai`;
  msgDiv.id = 'typingIndicator';
  
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = "<i class='bx bx-brain'></i>";
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'msg-content';
  contentDiv.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  
  msgDiv.appendChild(avatar);
  msgDiv.appendChild(contentDiv);
  chatMessages.appendChild(msgDiv);
  scrollToBottom();
}

function removeTypingIndicator() {
  const ind = document.getElementById('typingIndicator');
  if (ind) ind.remove();
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text && !uploadedFile) return;

  // Hide welcome screen on first message
  if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
    welcomeScreen.classList.add('hidden');
  }

  // Display User Message
  let userContent = text;
  if (uploadedFile) {
    userContent = `<div style="display:flex; align-items:center; gap:10px; margin-bottom: 8px;">
                     <i class='bx bx-file' style="color:#00f5ff; font-size: 20px;"></i> 
                     <strong>${uploadedFile.name}</strong>
                   </div>` + text;
  }
  
  const userMsg = createMessageElement('user', userContent, !!uploadedFile);
  chatMessages.appendChild(userMsg);
  
  chatInput.value = '';
  chatInput.style.height = 'auto';
  scrollToBottom();

  showTypingIndicator();

  try {
    let response;
    
    if (uploadedFile) {
      // Handle File Upload Analysis
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("query", text);
      formData.append("mode", currentMode);
      
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData
      });
      response = await res.json();
      
      // Clear file preview
      clearFilePreview();
      updateIntelligencePanel(response);
    } else {
      // Handle Standard Chat
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode: currentMode,
          chat_id: currentChatId
        })
      });
      response = await res.json();
      if(response.chat_id) currentChatId = response.chat_id;
    }

    removeTypingIndicator();
    
    if (response.error) {
      chatMessages.appendChild(createMessageElement('ai', `Error: ${response.error}`));
    } else {
      // Parse markdown safely based on marked version
      const textToParse = response.reply || response.findings || "Analysis complete.";
      let htmlContent = textToParse;
      try {
        if (typeof marked.parse === 'function') {
          htmlContent = marked.parse(textToParse);
        } else if (typeof marked === 'function') {
          htmlContent = marked(textToParse);
        }
      } catch (e) {
        console.error("Marked parsing error:", e);
      }
      chatMessages.appendChild(createMessageElement('ai', htmlContent, true));
    }
    
  } catch (err) {
    removeTypingIndicator();
    chatMessages.appendChild(createMessageElement('ai', `System Error: Unable to contact JusticeGPT backend. Verify API is online. [${err.message}]`));
  }
  
  scrollToBottom();
}

// ======================= FILE UPLOAD & PREVIEW =======================
const fileUpload = document.getElementById('fileUpload');
const filePreviewArea = document.getElementById('filePreviewArea');
const previewName = document.getElementById('previewName');
const previewSize = document.getElementById('previewSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const uploadDropzone = document.getElementById('uploadDropzone');

function setupFileUpload() {
  // Click upload
  fileUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Remove preview
  removeFileBtn.addEventListener('click', clearFilePreview);

  // Drag and Drop
  const dropArea = document.querySelector('.jgpt-layout');
  
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.classList.remove('hidden');
  });

  dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if(e.target === uploadDropzone) {
      uploadDropzone.classList.add('hidden');
    }
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.classList.add('hidden');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  });
}

function handleFileSelection(file) {
  uploadedFile = file;
  previewName.textContent = file.name;
  previewSize.textContent = (file.size / 1024 / 1024).toFixed(2) + " MB";
  filePreviewArea.classList.remove('hidden');
}

function clearFilePreview() {
  uploadedFile = null;
  fileUpload.value = "";
  filePreviewArea.classList.add('hidden');
}

// ======================= RIGHT PANEL UPDATES =======================
function updateIntelligencePanel(data) {
  if (data.details) {
    document.getElementById('fileDetailsWidget').classList.remove('hidden');
    document.getElementById('detHash').textContent = data.details.hash ? data.details.hash.substring(0,16)+"..." : "N/A";
    document.getElementById('detType').textContent = data.details.type || "Unknown";
    document.getElementById('detThreat').textContent = data.details.threat_level || "UNKNOWN";
    
    // Update threat text color
    const tl = document.getElementById('detThreat');
    if(data.details.threat_level === "HIGH" || data.details.threat_level === "CRITICAL") {
      tl.style.color = "#ff2b5e";
    } else if(data.details.threat_level === "LOW" || data.details.threat_level === "CLEAN") {
      tl.style.color = "#00ff88";
    } else {
      tl.style.color = "#ffc107";
    }
  }

  if(data.confidence) {
    document.getElementById('confidenceScore').textContent = data.confidence + "%";
  }

  filesAnalyzedCount++;
  document.getElementById('filesAnalyzedCount').textContent = filesAnalyzedCount + "+";
}

// ======================= QUICK ACTIONS =======================
function setupQuickActions() {
  const actionBtns = document.querySelectorAll('.action-btn');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      let prompt = "";
      
      switch(action) {
        case "analyze_evidence": prompt = "Analyze the provided evidence and summarize the key findings."; break;
        case "extract_ioc": prompt = "Extract all Indicators of Compromise (IPs, Domains, Hashes) from this evidence."; break;
        case "build_timeline": prompt = "Reconstruct a chronological timeline of events based on this data."; break;
        case "explain_artifact": prompt = "Explain this technical artifact in detail for a non-technical audience."; break;
        case "generate_report": 
          if(currentChatId) {
            downloadReport(currentChatId, "pdf");
          } else {
            chatMessages.appendChild(createMessageElement('ai', "No active investigation to report on. Start a conversation or upload evidence first."));
            scrollToBottom();
          }
          break;
      }

      if (prompt) {
        chatInput.value = prompt;
        sendMessage();
      }
    });
  });
}

async function downloadReport(chatId, format) {
  try {
    const res = await fetch(`${API_URL}/export?format=${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "", chat_id: chatId })
    });
    
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `JusticeGPT_Report_${chatId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      chatMessages.appendChild(createMessageElement('ai', `Report successfully generated and downloaded as ${format.toUpperCase()}.`));
      scrollToBottom();
    } else {
      chatMessages.appendChild(createMessageElement('ai', "Failed to generate report. Server returned an error."));
      scrollToBottom();
    }
  } catch(e) {
    chatMessages.appendChild(createMessageElement('ai', `Error downloading report: ${e.message}`));
    scrollToBottom();
  }
}
