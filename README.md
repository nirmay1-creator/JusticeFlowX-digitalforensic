<div align="center">
  <img src="https://raw.githubusercontent.com/nirmay1-creator/justiceflowx/main/frontend/assets/images/WhatsApp%20Image%202026-01-07%20at%209.59.21%20PM.jpeg" width="120" alt="JusticeFlowX Logo">
  
  # ⚖️ JusticeFlowX
  
  **Advanced Digital Forensics & Cyber-Investigative Verification System**
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
  [![HTML/CSS/JS](https://img.shields.io/badge/Frontend-Neo--Cyber-00d4ff?style=for-the-badge&logo=html5)](https://developer.mozilla.org/)

  ---
</div>

## 🌐 Overview

**JusticeFlowX** is a next-generation investigative suite and digital forensics dashboard designed for modern law enforcement, cyber security teams, and intelligence analysts. Featuring an incredibly immersive neo-cyber, glassmorphic UI, JusticeFlowX brings disparate investigation tools into a single, cohesive, high-tech command center.

From cryptographically securing the chain of custody to real-time network packet inspection and biometric authentication, JusticeFlowX makes handling critical digital infrastructure seamless and highly secure.

## ✨ Core Modules

- **📡 Infrastructure Control Center (System Health):** 100% real-time polling of host hardware (CPU, RAM, Disk I/O, Network Throughput) via a live FastAPI backend. Features an interactive "Threat Mode" that instantly secures infrastructure and isolates critical networks.
- **🧬 Biometric Authentication:** Immersive facial recognition and fingerprint scanning overlays required for accessing restricted case files.
- **🔗 Chain of Custody & Evidence Management:** A cryptographically secured, immutable ledger to track evidence handovers, ensuring 100% integrity of digital and physical assets.
- **🌐 Network Forensics:** Advanced real-time packet inspection (PCAP parsing), malware detection, and AI-driven threat intelligence analysis.
- **📄 Document Forensics:** AI-powered forensic analysis to detect forged IDs, metadata tampering, ink pattern discrepancies, and serial verification.
- **⚖️ Legal Education AI:** An integrated AI legal educator designed to decipher severe crimes, penalties, and legal definitions in plain English.
- **🗃️ Criminal DB & Case Control:** Centralized management of criminal profiles, case reports, and investigative notes.

## 🚀 Tech Stack

### **Backend**
- **FastAPI**: High-performance asynchronous REST API.
- **Psutil**: For live, bare-metal hardware metric extraction.
- **Pyshark**: Real-time PCAP parsing and network stream analysis.
- **SQLAlchemy / PostgreSQL**: For robust storage of case reports and evidence hashes.
- **Uvicorn**: Lightning-fast ASGI server.

### **Frontend**
- **Vanilla JS & HTML5**: Zero-bloat, lightning-fast interactivity.
- **Advanced CSS3**: Custom glassmorphism, neo-cyber color palettes, glowing scanlines, CRT noise overlays, and CSS Grid layouts.
- **Boxicons**: Crisp, scalable iconography.

## 🛠️ Getting Started

### Prerequisites
- Python 3.10+
- `pip` package manager
- (Optional) PostgreSQL for the full database experience

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nirmay1-creator/justiceflowx.git
   cd justiceflowx
   ```

2. **Setup the Python Backend Environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Start the API Server**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

4. **Launch the Frontend**
   Simply open `frontend/index.html` in your web browser, or serve it using a local development server (e.g., VS Code Live Server).

## 🛡️ "Threat Mode" Simulation
The Infrastructure Control Center features a highly stylized **Threat Mode**. When activated, the API simulates a massive cyber attack, dynamically altering hardware metrics (CPU spikes), flashing red alarms, and dumping critical breach alerts into the live terminal feed. 

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/nirmay1-creator/justiceflowx/issues) if you want to contribute.

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.
