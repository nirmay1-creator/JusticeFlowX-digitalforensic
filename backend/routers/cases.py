import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
import models
import schemas
from auth import RoleChecker, get_current_user
from database import get_db
import pcap_parser
from services.threat_intel import process_pcap_ips

router = APIRouter(
    prefix="/api/cases",
    tags=["Cases"]
)

# Only Admin and Investigator can create cases
allow_create_case = RoleChecker([models.RoleEnum.Admin, models.RoleEnum.Investigator])

@router.post("/", response_model=schemas.CaseResponse)
def create_case(
    case: schemas.CaseCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_create_case)
):
    db_case = db.query(models.Case).filter(models.Case.case_number == case.case_number).first()
    if db_case:
        raise HTTPException(status_code=400, detail="Case number already exists")
    
    new_case = models.Case(
        case_number=case.case_number,
        title=case.title,
        suspect_name=case.suspect_name,
        status=case.status
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

@router.get("/", response_model=list[schemas.CaseResponse])
def get_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Assuming any authenticated user can view cases for now
    cases = db.query(models.Case).offset(skip).limit(limit).all()
    return cases

@router.post("/{case_id}/upload-pcap", response_model=schemas.NetworkForensicResponse)
async def upload_pcap(
    case_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if case exists
    db_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    import tempfile
    from werkzeug.utils import secure_filename

    if not file.filename.endswith(('.pcap', '.pcapng')):
        raise HTTPException(status_code=400, detail="Only .pcap or .pcapng files are allowed")

    # Secure temporary file creation to prevent Path Traversal
    safe_filename = secure_filename(file.filename)
    fd, temp_filepath = tempfile.mkstemp(suffix=f"_{safe_filename}")
    os.close(fd) # Close the file descriptor, we will use the path

    
    try:
        content = await file.read()
        with open(temp_filepath, "wb") as f:
            f.write(content)

        # Parse PCAP synchronously (pyshark does its own event loop handling, 
        # but running it inline here might block the event loop briefly. 
        # For small max_packets=1000 it is acceptable for this prototype).
        parsed_data = pcap_parser.parse_pcap(temp_filepath, max_packets=1000)

        # Save to database
        forensic_record = models.NetworkForensic(
            case_id=case_id,
            parsed_data=parsed_data
        )
        db.add(forensic_record)
        db.commit()
        db.refresh(forensic_record)
        # Schedule background task to process IPs for threat intel
        dst_ips = parsed_data.get("unique_destination_ips", [])
        if dst_ips:
            background_tasks.add_task(process_pcap_ips, case_id, dst_ips)
        
        return forensic_record

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PCAP: {str(e)}")
    finally:
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)

@router.get("/{case_id}/threat-report")
def get_threat_report(case_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    forensic_record = db.query(models.NetworkForensic).filter(models.NetworkForensic.case_id == case_id).order_by(models.NetworkForensic.created_at.desc()).first()
    if not forensic_record:
        raise HTTPException(status_code=404, detail="No network forensics found for this case")
    
    parsed_data = forensic_record.parsed_data
    dst_ips = parsed_data.get("unique_destination_ips", [])
    
    report = {
        "case_id": case_id,
        "total_ips_analyzed": len(dst_ips),
        "clean_ips": [],
        "malicious_ips": [],
        "pending_ips": []
    }
    
    for ip in dst_ips:
        cache = db.query(models.IPReputationCache).filter(models.IPReputationCache.ip_address == ip).first()
        if not cache:
            report["pending_ips"].append(ip)
        elif cache.is_malicious:
            report["malicious_ips"].append({"ip": ip, "score": cache.abuse_confidence_score})
        else:
            report["clean_ips"].append(ip)
            
    return report
