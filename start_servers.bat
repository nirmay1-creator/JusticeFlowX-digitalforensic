@echo off
echo Starting JusticeFlowX Backend Servers...

set PYTHON_BIN="c:\Users\Nirmay Rinesh\Desktop\justiceflowx\backend\venv\Scripts\python.exe"
set CWD="c:\Users\Nirmay Rinesh\Desktop\justiceflowx\backend"

cd /d %CWD%

start "Main API (Port 8001)" %PYTHON_BIN% -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
start "Threat Intel (Port 8675)" %PYTHON_BIN% app.py
start "DFIR Engine (Port 5003)" %PYTHON_BIN% run_dfir.py
start "Malware Server (Port 5002)" %PYTHON_BIN% malware_server.py
start "Doc Server (Port 5001)" %PYTHON_BIN% doc_server.py
start "Backend Server (Port 5000)" %PYTHON_BIN% "Backend server.py"
start "Fingerprint System" %PYTHON_BIN% finger_print.py

echo All servers launched in separate windows!
pause
