"""
JusticeFlowX — Fingerprint Verification Backend
================================================
Python Flask API server for fingerprint record lookup.

SETUP:
  pip install flask flask-cors

RUN:
  python backend_server.py

Then in finger2.js set:
  CONFIG.USE_BACKEND = true;
  CONFIG.BACKEND_URL  = "http://localhost:5000";

ENDPOINTS:
  GET  /api/fingerprint/<id>   — look up a fingerprint record
  GET  /api/fingerprints       — list all records (admin)
  POST /api/fingerprint        — add new record (admin)
  GET  /api/status             — system health check
"""

from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow requests from browser (cross-origin)

# ----------------------------------------------------------------
# IN-MEMORY DATABASE
# Replace this with a real SQLite / PostgreSQL database in production.
# ----------------------------------------------------------------
FINGERPRINT_DATABASE = {
    "FP1001": {
        "id": "FP1001",
        "name": "Rahul Sharma",
        "criminal": True,
        "case": "Robbery Case 2023",
        "confidence": 98.4,
        "dob": "1988-04-15",
        "nationality": "IN",
        "registered": "2023-01-10",
    },
    "FP1002": {
        "id": "FP1002",
        "name": "Amit Verma",
        "criminal": False,
        "confidence": 99.1,
        "dob": "1995-07-22",
        "nationality": "IN",
        "registered": "2022-05-03",
    },
    "FP1003": {
        "id": "FP1003",
        "name": "Sneha Patil",
        "criminal": False,
        "confidence": 97.8,
        "dob": "1992-11-30",
        "nationality": "IN",
        "registered": "2023-09-14",
    },
    "FP1004": {
        "id": "FP1004",
        "name": "Rakesh Mehta",
        "criminal": True,
        "case": "Fraud Case 2022",
        "confidence": 96.2,
        "dob": "1980-02-08",
        "nationality": "IN",
        "registered": "2022-11-22",
    },
    "FP1005": {
        "id": "FP1005",
        "name": "Pooja Desai",
        "criminal": False,
        "confidence": 99.4,
        "dob": "1998-06-18",
        "nationality": "IN",
        "registered": "2024-01-05",
    },
    "FP1006": {
        "id": "FP1006",
        "name": "Vikram Nair",
        "criminal": True,
        "case": "Assault Case 2021",
        "confidence": 95.7,
        "dob": "1975-09-12",
        "nationality": "IN",
        "registered": "2021-04-30",
    },
    "FP1007": {
        "id": "FP1007",
        "name": "Anjali Singh",
        "criminal": False,
        "confidence": 98.9,
        "dob": "2000-03-25",
        "nationality": "IN",
        "registered": "2024-06-20",
    },
    "FP1008": {
        "id": "FP1008",
        "name": "Deepak Gupta",
        "criminal": True,
        "case": "Cybercrime Case 2024",
        "confidence": 97.3,
        "dob": "1985-12-01",
        "nationality": "IN",
        "registered": "2024-03-15",
    },
}

# ----------------------------------------------------------------
# LOOKUP ENDPOINT
# GET /api/fingerprint/<id>
# id can be bare number "1001" or full "FP1001"
# ----------------------------------------------------------------
@app.route("/api/fingerprint/<fp_id>", methods=["GET"])
def get_fingerprint(fp_id):
    # Normalize: accept "1001" or "FP1001"
    if not fp_id.upper().startswith("FP"):
        fp_id = "FP" + fp_id

    fp_id = fp_id.upper()
    record = FINGERPRINT_DATABASE.get(fp_id)

    if not record:
        return jsonify({
            "found": False,
            "id": fp_id,
            "message": "No record found in database",
            "timestamp": datetime.utcnow().isoformat(),
        }), 200

    return jsonify({
        "found": True,
        "id": fp_id,
        "record": record,
        "scan_time_ms": 1200,
        "timestamp": datetime.utcnow().isoformat(),
    }), 200


# ----------------------------------------------------------------
# LIST ALL RECORDS (admin use)
# GET /api/fingerprints
# ----------------------------------------------------------------
@app.route("/api/fingerprints", methods=["GET"])
def list_fingerprints():
    return jsonify({
        "count": len(FINGERPRINT_DATABASE),
        "records": list(FINGERPRINT_DATABASE.values()),
        "timestamp": datetime.utcnow().isoformat(),
    }), 200


# ----------------------------------------------------------------
# ADD NEW RECORD
# POST /api/fingerprint
# Body: { "id": "FP1009", "name": "...", "criminal": false, ... }
# ----------------------------------------------------------------
@app.route("/api/fingerprint", methods=["POST"])
def add_fingerprint():
    data = request.get_json()
    if not data:
        abort(400, "JSON body required")

    fp_id = data.get("id", "").upper()
    if not fp_id:
        abort(400, "Missing 'id' field")
    if not fp_id.startswith("FP"):
        fp_id = "FP" + fp_id

    if fp_id in FINGERPRINT_DATABASE:
        return jsonify({"error": "Record already exists", "id": fp_id}), 409

    new_record = {
        "id": fp_id,
        "name": data.get("name", "Unknown"),
        "criminal": bool(data.get("criminal", False)),
        "case": data.get("case"),
        "confidence": float(data.get("confidence", 97.0)),
        "dob": data.get("dob"),
        "nationality": data.get("nationality", "IN"),
        "registered": datetime.utcnow().strftime("%Y-%m-%d"),
    }
    FINGERPRINT_DATABASE[fp_id] = new_record

    return jsonify({
        "success": True,
        "id": fp_id,
        "record": new_record,
        "timestamp": datetime.utcnow().isoformat(),
    }), 201


# ----------------------------------------------------------------
# HEALTH CHECK
# GET /api/status
# ----------------------------------------------------------------
@app.route("/api/status", methods=["GET"])
def status():
    return jsonify({
        "status": "online",
        "system": "JusticeFlowX Biometric API",
        "version": "2.4",
        "records": len(FINGERPRINT_DATABASE),
        "timestamp": datetime.utcnow().isoformat(),
    }), 200


# ----------------------------------------------------------------
# RUN SERVER
# ----------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 50)
    print("  JusticeFlowX Fingerprint API")
    print("  Running on http://localhost:5000")
    print("  Set CONFIG.USE_BACKEND = true in finger2.js")
    print("=" * 50)
    app.run(debug=True, host="0.0.0.0", port=5000)