import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from starlette.concurrency import run_in_threadpool
from services.threat_hunter_service import analyze_pcap

router = APIRouter(
    prefix="/api/v1/threat-hunter",
    tags=["threat-hunter"],
)

UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "justiceflowx_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/analyze")
async def analyze_capture(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.pcap', '.pcapng')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .pcap or .pcapng files are supported.")
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # Save uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
        
    # Analyze the PCAP using our ML service
    try:
        result = await run_in_threadpool(analyze_pcap, file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing PCAP: {e}")
    finally:
        # Clean up
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
                
    return result
