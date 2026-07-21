import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from ..config import settings
from ..database import get_db
from ..models import AnalysisJob

router = APIRouter(prefix="/api/dfir", tags=["reports"])

@router.get("/report/{job_id}")
async def generate_pdf_report(job_id: str, db: Session = Depends(get_db)):
    """
    Generate and download a PDF report for a completed analysis.
    """
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Analysis is not completed yet.")
        
    report_path = os.path.join(settings.REPORTS_DIR, f"{job.job_id}_report.pdf")
    
    # Simple PDF generation using reportlab
    if not os.path.exists(report_path):
        c = canvas.Canvas(report_path, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, 750, f"DFIR Analysis Report: {job.original_filename}")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, 710, f"Job ID: {job.job_id}")
        c.drawString(50, 690, f"Analysis Time: {job.completed_at}")
        c.drawString(50, 670, f"File Size: {job.file_size} bytes")
        c.drawString(50, 650, f"MIME Type: {job.mime_type}")
        
        c.drawString(50, 610, f"MD5: {job.md5}")
        c.drawString(50, 590, f"SHA256: {job.sha256}")
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, 550, f"Threat Score: {job.threat_score} / 100")
        c.drawString(50, 530, f"Severity: {job.severity}")
        
        # We can add much more detail here based on job.result_json, but this is a start
        c.save()
        
    return FileResponse(
        report_path, 
        media_type="application/pdf", 
        filename=f"JusticeFlowX_Report_{job.original_filename}.pdf"
    )
