from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import hashlib
import re
import uuid
import magic
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Configure allowed origins from .env, fallback to localhost
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost").split(",")
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Global Error Handler to prevent Information Leakage
@app.errorhandler(Exception)
def handle_exception(e):
    # Log the error securely on the server
    print(f"Internal Server Error: {repr(e)}")
    return jsonify({"error": "An internal server error occurred."}), 500

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------------
# DOCUMENT UPLOAD & METADATA
# ---------------------------------------------------------

def generate_hashes(file_path):
    md5 = hashlib.md5()
    sha1 = hashlib.sha1()
    sha256 = hashlib.sha256()

    with open(file_path, 'rb') as f:
        while chunk := f.read(8192):
            md5.update(chunk)
            sha1.update(chunk)
            sha256.update(chunk)

    return {
        "MD5": md5.hexdigest(),
        "SHA1": sha1.hexdigest(),
        "SHA256": sha256.hexdigest()
    }

def extract_pdf_metadata(file_path):
    try:
        reader = PdfReader(file_path)
        meta = reader.metadata
        if not meta:
            return {"Error": "No metadata found in PDF"}

        return {
            "Author": meta.get("/Author", "Unknown"),
            "Creator": meta.get("/Creator", "Unknown"),
            "Producer": meta.get("/Producer", "Unknown"),
            "Subject": meta.get("/Subject", "None"),
            "Title": meta.get("/Title", "Untitled"),
            "CreationDate": meta.get("/CreationDate", "Unknown")
        }
    except Exception as e:
        return {"Error": str(e)}

@app.route('/api/doc/upload', methods=['POST'])
@limiter.limit("10 per minute")
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    # Generate UUID for physical filename to prevent path traversal and execution
    physical_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(UPLOAD_FOLDER, physical_filename)
    file.save(file_path)
    
    # Validate Magic Bytes (File Signature)
    mime_type = magic.from_file(file_path, mime=True)
    if mime_type != 'application/pdf':
        os.remove(file_path) # Delete invalid file immediately
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

    hashes = generate_hashes(file_path)
    
    metadata = {}
    if filename.lower().endswith('.pdf'):
        metadata = extract_pdf_metadata(file_path)
    else:
        metadata = {"Info": "File is not a PDF, basic metadata only."}
        
    file_size = os.path.getsize(file_path)

    return jsonify({
        "filename": file.filename,
        "size": f"{file_size / 1024:.2f} KB",
        "hashes": hashes,
        "metadata": metadata,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

# ---------------------------------------------------------
# SERIAL NUMBER VERIFICATION
# ---------------------------------------------------------

# Dummy backend databases for serial verification
REVOKED_SERIALS = {"IND-2024-XX9999", "USA-B2-0000000"}
DUPLICATE_SERIALS = {"IND-2024-AB123456"}

def validate_format(serial, doc_type):
    if not serial or len(serial) < 5:
        return False
    patterns = {
        'national_id': r'^[A-Z]{2,3}[-_]?\d{2,4}[-_]?[A-Z0-9]{4,10}$',
        'passport': r'^[A-Z]{2,3}\d{6,9}$',
        'drivers_license': r'^[A-Z]{2}[-_]?\d{2,4}[-_]?\d{6,12}$',
        'visa': r'^[A-Z]{2,3}[-_]?[A-Z0-9]{2,4}[-_]?\d{6,12}$'
    }
    pattern = patterns.get(doc_type, r'.+')
    return bool(re.match(pattern, serial))

def analyze_serial_logic(serial, doc_type):
    # This logic matches what the JS pseudo-random function did, 
    # but uses our backend "databases" where available.
    serial_upper = serial.upper()
    format_valid = validate_format(serial_upper, doc_type)
    
    # Check if year is in range (only for docs that include a year)
    year_in_range = True
    if doc_type in ['national_id', 'drivers_license']:
        match = re.search(r'\d{4}', serial_upper)
        if match:
            y = int(match.group(0))
            if not (1990 <= y <= 2026):
                year_in_range = False
        else:
            # If it requires a year and doesn't have one, it's invalid
            year_in_range = False

    # Check against our sets
    is_revoked = serial_upper in REVOKED_SERIALS
    is_duplicate = serial_upper in DUPLICATE_SERIALS
    
    # Deterministic fallback for unknown serials (to simulate large DB)
    hash_val = sum(ord(c) for c in serial_upper)
    seed = hash_val % 100
    
    # Only apply these if it wasn't caught by exact match
    if not is_revoked and not is_duplicate:
        if seed > 95:
            is_revoked = True
        elif seed > 90:
            is_duplicate = True
            
    not_found = (seed > 85 and seed <= 90) and not is_revoked and not is_duplicate

    is_clean = format_valid and year_in_range and not is_revoked and not is_duplicate and not not_found

    return {
        "serial": serial_upper,
        "seed": seed,
        "formatValid": format_valid,
        "yearInRange": year_in_range,
        "isRevoked": is_revoked,
        "isDuplicate": is_duplicate,
        "notFound": not_found,
        "isClean": is_clean
    }

@app.route('/api/doc/serial_verify', methods=['POST'])
def serial_verify():
    data = request.json
    if not data or 'serial' not in data or 'docType' not in data:
        return jsonify({"error": "Missing serial or docType"}), 400
    
    result = analyze_serial_logic(data['serial'], data['docType'])
    return jsonify(result)

@app.route('/api/doc/serial_batch_verify', methods=['POST'])
def serial_batch_verify():
    data = request.json
    if not data or 'serials' not in data or 'docType' not in data:
        return jsonify({"error": "Missing serials array or docType"}), 400
    
    results = []
    for s in data['serials']:
        results.append(analyze_serial_logic(s, data['docType']))
    
    return jsonify({"results": results})


if __name__ == '__main__':
    print("=" * 50)
    print("  JusticeFlowX Document Forensics API")
    print("  Running on http://localhost:5001")
    print("=" * 50)
    debug_mode = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    app.run(host='0.0.0.0', port=5001, debug=debug_mode)
