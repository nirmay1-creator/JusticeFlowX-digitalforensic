import time
import os
import requests
import psycopg2
from datetime import datetime

# Configuration
CHECK_INTERVAL = 60
MD_FILE_PATH = "check.md"

# Endpoints & DB connection
FRONTEND_URL = "http://localhost:80"
BACKEND_HEALTH_URL = "http://localhost:8000/health"
DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:securepassword123@localhost:5432/justiceflowx")
UPLOAD_DIR = "./uploads"

def check_frontend():
    try:
        res = requests.get(FRONTEND_URL, timeout=5)
        if res.status_code == 200:
            return "🟢", "Online"
        return "🟡", f"Degraded (Status: {res.status_code})"
    except Exception as e:
        return "🔴", "Offline"

def check_backend():
    try:
        res = requests.get(BACKEND_HEALTH_URL, timeout=5)
        if res.status_code == 200:
            return "🟢", "Online"
        return "🟡", f"Degraded (Status: {res.status_code})"
    except Exception:
        return "🔴", "Offline"

def check_database():
    try:
        conn = psycopg2.connect(DB_URL, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cases');")
        exists = cur.fetchone()[0]
        cur.close()
        conn.close()
        if exists:
            return "🟢", "Online (Tables verified)"
        return "🟡", "Online (Tables missing)"
    except Exception as e:
        return "🔴", "Offline / Unreachable"

def check_threat_intel():
    # 1. Check if the environment variable is loaded
    api_key = os.getenv("ABUSEIPDB_API_KEY")
    mock_mode = os.getenv("THREAT_INTEL_MOCK_MODE", "false").lower() == "true"
    
    if not api_key:
        if mock_mode:
            return "🟢", "Online (Mock Mode Active)"
        return "🟡", "Warning (API Key Missing)"
        
    # 2. Lightweight ping to verify the service is reachable
    try:
        # Pinging a known safe IP to test API connectivity
        url = "https://api.abuseipdb.com/api/v2/check?ipAddress=8.8.8.8"
        headers = {'Accept': 'application/json', 'Key': api_key}
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            return "🟢", "Online (API Accessible)"
        elif res.status_code == 401:
            return "🔴", "Offline (Invalid API Key)"
        elif res.status_code == 429:
            return "🟡", "Degraded (Rate Limited)"
        return "🟡", f"Degraded (Status {res.status_code})"
    except Exception:
        return "🔴", "Offline (Service Unreachable)"

def check_storage():
    try:
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
        
        # Check write permissions by trying to create a temporary file
        test_file = os.path.join(UPLOAD_DIR, ".healthcheck")
        with open(test_file, 'w') as f:
            f.write("test")
        os.remove(test_file)
        return "🟢", "Healthy (R/W Access)"
    except Exception as e:
        return "🔴", f"Failing ({str(e)})"

def generate_report():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Running system health checks...")
    
    frontend_status, frontend_msg = check_frontend()
    backend_status, backend_msg = check_backend()
    db_status, db_msg = check_database()
    threat_status, threat_msg = check_threat_intel()
    storage_status, storage_msg = check_storage()

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    markdown_content = f"""# JusticeFlowX - Live System Status
**Last Updated:** {timestamp}

| Status | Component | Details |
|:---:|---|---|
| {frontend_status} | **Frontend (Nginx)** | {frontend_msg} |
| {backend_status} | **Backend API (FastAPI)** | {backend_msg} |
| {db_status} | **Database (PostgreSQL)** | {db_msg} |
| {threat_status} | **Threat Intel API** | {threat_msg} |
| {storage_status} | **Storage Volume (/uploads)** | {storage_msg} |

> *This report is automatically generated every 60 seconds by `health_monitor.py`.*
"""
    
    # Write to file
    with open(MD_FILE_PATH, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Report successfully written to {MD_FILE_PATH}")

if __name__ == "__main__":
    print("Starting JusticeFlowX Health Monitor...")
    print(f"Looping checks every {CHECK_INTERVAL} seconds. Press Ctrl+C to stop.\n")
    
    try:
        while True:
            generate_report()
            time.sleep(CHECK_INTERVAL)
    except KeyboardInterrupt:
        print("\nShutting down monitor gracefully...")
