from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AnalysisJob
from ..pipeline import run_analysis_pipeline

router = APIRouter(prefix="/api/dfir", tags=["analysis"])

@router.post("/analyze/{job_id}")
async def trigger_analysis(job_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Trigger the analysis pipeline for a specific job_id.
    Runs asynchronously in the background.
    """
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status not in ("queued", "failed"):
        return {"job_id": job.job_id, "status": job.status, "message": "Job is already processing or completed."}
        
    # We can run it in a background task so the request returns immediately
    background_tasks.add_task(run_analysis_pipeline, job.job_id, db)
    
    # Update status to indicate we started
    job.status = "processing"
    db.commit()
    
    return {"job_id": job.job_id, "status": "processing", "message": "Analysis started."}


@router.get("/status/{job_id}")
async def get_analysis_result(job_id: str, db: Session = Depends(get_db)):
    """
    Get the current status and results of an analysis job.
    """
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return job.to_dict()


@router.get("/analyses")
async def list_analyses(limit: int = 50, db: Session = Depends(get_db)):
    """
    List recent analysis jobs.
    """
    jobs = db.query(AnalysisJob).order_by(AnalysisJob.created_at.desc()).limit(limit).all()
    return [job.to_dict() for job in jobs]
