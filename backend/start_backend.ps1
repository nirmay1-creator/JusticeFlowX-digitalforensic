$ErrorActionPreference = "Stop"

Write-Host "Starting JusticeFlowX Backend Services..."

# Paths to the scripts
Start-Process -FilePath "cmd.exe" -ArgumentList "/k venv\Scripts\activate.bat && title Main API (8000) && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k venv\Scripts\activate.bat && title Network Forensics (8675) && python app.py"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k venv\Scripts\activate.bat && title Fingerprint API (5000) && python ""Backend server.py"""
Start-Process -FilePath "cmd.exe" -ArgumentList "/k venv\Scripts\activate.bat && title Document Forensics (5001) && python doc_server.py"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k venv\Scripts\activate.bat && title Malware API (5002) && python malware_server.py"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k venv\Scripts\activate.bat && title DFIR Engine (5003) && python run_dfir.py"

Write-Host "All backend services have been started in separate windows."
