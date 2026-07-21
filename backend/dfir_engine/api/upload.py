import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models import AnalysisJob
from ..core.security import validate_upload, sanitize_filename, detect_file_type

router = APIRouter(prefix="/api/dfir", tags=["upload"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Receive file, validate, store it securely, and create an AnalysisJob.
    """
    # 1. Read file to memory to check size
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    # 2. Validate
    is_valid, err_msg = validate_upload(file.filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)
        
    # 3. Save securely
    safe_name = sanitize_filename(file.filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    # 4. Detect type
    mime_type, file_type = detect_file_type(file_path)
    
    # 5. Create Job
    job = AnalysisJob(
        original_filename=file.filename,
        stored_filename=safe_name,
        file_size=file_size,
        mime_type=mime_type,
        file_type=file_type,
        status="queued"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    return {
        "job_id": job.job_id,
        "filename": job.original_filename,
        "status": job.status,
        "message": "File uploaded successfully. Ready for analysis."
    }
