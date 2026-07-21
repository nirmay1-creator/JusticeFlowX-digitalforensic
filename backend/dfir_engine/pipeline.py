import os
import traceback
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .models import AnalysisJob, YaraMatch
from .config import settings
from .core.hashing import compute_hashes
from .analyzers import (
    pe_analyzer,
    pcap_analyzer,
    entropy,
    strings_analyzer,
    imports_analyzer,
    yara_scan,
    behavior,
    threat_score
)

def run_analysis_pipeline(job_id: str, db: Session):
    """
    Executes the full malware analysis pipeline for a given job.
    """
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        return
        
    try:
        job.status = "processing"
        db.commit()
        
        file_path = os.path.join(settings.UPLOAD_DIR, job.stored_filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {job.stored_filename} not found. It may have been removed or quarantined by antivirus.")
        if os.path.getsize(file_path) == 0:
            raise ValueError(f"File {job.stored_filename} is 0 bytes. It may have been blocked or quarantined by antivirus.")

        results = {}

        # 1. Hashing
        hashes = compute_hashes(file_path)
        job.md5 = hashes["md5"]
        job.sha1 = hashes["sha1"]
        job.sha256 = hashes["sha256"]
        job.sha512 = hashes["sha512"]
        results["hashes"] = hashes

        # 2. String Extraction
        ioc_strings = strings_analyzer.extract_strings(file_path)
        results["strings"] = ioc_strings

        # 3. YARA Scanning
        yara_matches = yara_scan.scan_file(file_path)
        results["yara"] = yara_matches
        
        # Save YARA matches to DB
        for match in yara_matches:
            db_match = YaraMatch(
                job_id=job.job_id,
                rule_name=match["rule_name"],
                category=match["category"],
                severity=match["severity"],
                description=match["description"],
                matched_strings=match["matched_strings"]
            )
            db.add(db_match)

        # 4. Type-Specific Analysis
        suspicious_apis = []
        entropy_info = {}
        pcap_info = {}
        
        if job.file_type == "PE":
            pe_info = pe_analyzer.analyze_pe(file_path)
            results["pe_info"] = pe_info
            
            if "error" not in pe_info:
                # Entropy
                entropy_info = entropy.analyze_entropy(file_path, pe_info.get("sections"))
                results["entropy"] = entropy_info
                
                # Imports
                suspicious_apis = imports_analyzer.analyze_imports(pe_info.get("imports", []))
                results["suspicious_apis"] = suspicious_apis
        elif job.file_type == "PCAP":
            pcap_info = pcap_analyzer.analyze_pcap(file_path)
            results["pcap_info"] = pcap_info
            
            if "error" not in pcap_info:
                # Merge IOCs from PCAP into ioc_strings
                if "ips" not in ioc_strings:
                    ioc_strings["ips"] = []
                ioc_strings["ips"].extend(pcap_info.get("iocs", {}).get("ips", []))
                ioc_strings["ips"] = list(set(ioc_strings["ips"]))
                
                if "urls" not in ioc_strings: # Use urls array for domains for now to render in UI
                    ioc_strings["urls"] = []
                ioc_strings["urls"].extend(pcap_info.get("iocs", {}).get("domains", []))
                ioc_strings["urls"] = list(set(ioc_strings["urls"]))
        else:
            # Basic entropy for non-PE
            entropy_info = entropy.analyze_entropy(file_path)
            results["entropy"] = entropy_info

        # 5. MITRE ATT&CK Mapping
        mitre_mapping = behavior.map_mitre(suspicious_apis, ioc_strings)
        if "mitre" in pcap_info and "error" not in pcap_info:
            mitre_mapping.extend(pcap_info["mitre"])
        results["mitre"] = mitre_mapping

        # 6. Threat Scoring
        score, severity = threat_score.calculate_threat_score(
            entropy_info, suspicious_apis, yara_matches, ioc_strings, pcap_info
        )
        
        job.threat_score = score
        job.severity = severity
        job.result_json = results
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        
        db.commit()

    except Exception as e:
        job.status = "failed"
        job.error_message = str(e) + "\n" + traceback.format_exc()
        db.commit()
        print(f"Analysis failed for {job_id}: {e}")
