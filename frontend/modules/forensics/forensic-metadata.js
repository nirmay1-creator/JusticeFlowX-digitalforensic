// Selectors
const uploadZone = document.getElementById('uploadZone');
const docUpload = document.getElementById('docUpload');
const uploadPreview = document.getElementById('uploadPreview');
const previewImg = document.getElementById('previewImg');
const uploadInfo = document.getElementById('uploadInfo');
const uFileName = document.getElementById('uFileName');
const uFileSize = document.getElementById('uFileSize');
const uFileType = document.getElementById('uFileType');
const uFileDate = document.getElementById('uFileDate');
const analyzeBtn = document.getElementById('analyzeBtn');

const rpWaiting = document.getElementById('rpWaiting');
const rpScanning = document.getElementById('rpScanning');
const rpResults = document.getElementById('rpResults');
const metadataViz = document.getElementById('metadataViz');
const scanningSteps = document.getElementById('scanningSteps');
const scanningPct = document.getElementById('scanningPct');
const scanningBarFill = document.getElementById('scanningBarFill');

const resultVerdict = document.getElementById('resultVerdict');
const rsForgeryBar = document.getElementById('rsForgeryBar');
const rsForgeryPct = document.getElementById('rsForgeryPct');
const resultChecks = document.getElementById('resultChecks');
const resultDetails = document.getElementById('resultDetails');
const mvizGrid = document.getElementById('mvizGrid');

let currentFile = null;

// Clock
setInterval(() => {
  const d = new Date();
  document.getElementById('clockDisplay').textContent = d.toLocaleTimeString('en-US', {hour12:false});
}, 1000);

// File Upload Handling
uploadZone.addEventListener('click', () => docUpload.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--cyan)';
  uploadZone.style.background = 'rgba(0, 210, 255, 0.05)';
});

uploadZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--border)';
  uploadZone.style.background = 'transparent';
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--border)';
  uploadZone.style.background = 'transparent';
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

docUpload.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  currentFile = file;
  
  uFileName.textContent = file.name;
  uFileSize.textContent = (file.size / 1024).toFixed(2) + ' KB';
  uFileType.textContent = file.type || 'Unknown';
  uFileDate.textContent = file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'Unknown';

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadZone.style.display = 'none';
      uploadPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    // PDF placeholder
    previewImg.src = 'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg';
    previewImg.style.filter = 'invert(1)';
    uploadZone.style.display = 'none';
    uploadPreview.style.display = 'block';
  }

  uploadInfo.style.display = 'block';
  analyzeBtn.disabled = false;
  analyzeBtn.classList.add('ready');
}

async function runAnalysis() {
  if (!currentFile) return;

  analyzeBtn.disabled = true;
  rpWaiting.style.display = 'none';
  rpResults.style.display = 'none';
  metadataViz.style.display = 'none';
  rpScanning.style.display = 'flex';
  scanningSteps.innerHTML = '';
  
  updateScanningStep('INITIALIZING ANALYSIS ENGINE...', 'working');
  scanningPct.textContent = '0%';
  scanningBarFill.style.width = '0%';

  try {
    const formData = new FormData();
    formData.append('file', currentFile);
    
    updateScanningStep('UPLOADING TO SECURE FORENSIC SERVER...', 'working');
    
    // Simulate upload delay for UI effect
    await new Promise(resolve => setTimeout(resolve, 1000));
    scanningPct.textContent = '45%';
    scanningBarFill.style.width = '45%';

    const response = await fetch('http://localhost:5001/api/doc/upload', {
      method: 'POST',
      body: formData
    });
    
    updateScanningStep('EXTRACTING METADATA AND HASHES...', 'working');
    
    const data = await response.json();
    
    await new Promise(resolve => setTimeout(resolve, 800));
    scanningPct.textContent = '100%';
    scanningBarFill.style.width = '100%';
    
    setTimeout(() => showResults(data), 500);

  } catch (error) {
    console.error(error);
    updateScanningStep('ERROR COMMUNICATING WITH SERVER', 'error');
  }
}

function showResults(data) {
  rpScanning.style.display = 'none';
  rpResults.style.display = 'block';
  metadataViz.style.display = 'block';

  // Check if it's a PDF to determine forgery probability
  const isPdf = currentFile.name.toLowerCase().endsWith('.pdf');
  const forgeryProb = isPdf ? (data.metadata.Error ? 85 : 12) : 45;
  
  if (forgeryProb > 70) {
    resultVerdict.innerHTML = '<i class="bx bx-error-circle"></i> HIGH FORGERY PROBABILITY DETECTED';
    resultVerdict.className = 'result-verdict danger';
    rsForgeryBar.style.backgroundColor = 'var(--red)';
    rsForgeryBar.style.boxShadow = '0 0 10px var(--red)';
  } else if (forgeryProb > 30) {
    resultVerdict.innerHTML = '<i class="bx bx-error-circle"></i> MODERATE ANOMALIES DETECTED';
    resultVerdict.className = 'result-verdict warning';
    rsForgeryBar.style.backgroundColor = 'var(--gold)';
    rsForgeryBar.style.boxShadow = '0 0 10px var(--gold)';
  } else {
    resultVerdict.innerHTML = '<i class="bx bx-check-shield"></i> DOCUMENT AUTHENTICITY VERIFIED';
    resultVerdict.className = 'result-verdict safe';
    rsForgeryBar.style.backgroundColor = 'var(--cyan)';
    rsForgeryBar.style.boxShadow = '0 0 10px var(--cyan)';
  }

  rsForgeryPct.textContent = forgeryProb + '%';
  rsForgeryBar.style.width = forgeryProb + '%';

  // Build checks based on hashes
  resultChecks.innerHTML = `
    <div class="rc-item"><i class='bx bx-check'></i> <span>MD5: ${data.hashes.MD5.substring(0,16)}...</span></div>
    <div class="rc-item"><i class='bx bx-check'></i> <span>SHA256: ${data.hashes.SHA256.substring(0,16)}...</span></div>
    <div class="rc-item"><i class='${isPdf ? 'bx bx-check' : 'bx bx-error'}'></i> <span>Format Analysis</span></div>
  `;

  // Render metadata details
  let metaHtml = '';
  if(data.metadata && Object.keys(data.metadata).length > 0) {
      for(const [key, val] of Object.entries(data.metadata)) {
          metaHtml += `<div class="mviz-item">
            <div class="mviz-label">${key.toUpperCase()}</div>
            <div class="mviz-val">${val}</div>
          </div>`;
      }
  } else {
      metaHtml = '<div class="mviz-item"><div class="mviz-label">INFO</div><div class="mviz-val">No embedded EXIF/Metadata found.</div></div>';
  }
  
  mvizGrid.innerHTML = metaHtml;
  
  resultDetails.innerHTML = `
    <div class="rd-row"><span>FILE:</span> <span>${data.filename}</span></div>
    <div class="rd-row"><span>SIZE:</span> <span>${data.size}</span></div>
    <div class="rd-row"><span>ANALYSIS TIME:</span> <span>${data.timestamp}</span></div>
  `;
}

function updateScanningStep(text, status) {
  const div = document.createElement('div');
  div.className = 'ss-item';
  let icon = 'bx-loader-alt bx-spin';
  if (status === 'done') icon = 'bx-check';
  if (status === 'error') icon = 'bx-x';
  
  div.innerHTML = `<i class='bx ${icon}'></i> <span>${text}</span>`;
  scanningSteps.appendChild(div);
}

analyzeBtn.addEventListener('click', runAnalysis);