from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Load users for fingerprint verification
with open('data.json', 'r') as f:
    users = json.load(f)

# ------------------ Routes ------------------

@app.route('/')
def dashboard():
    return render_template('index.html')  # dashboard is index.html

@app.route('/fingerprint')
def fingerprint():
    return render_template('finger_print.html')

@app.route('/face_scan')
def face_scan():
    return render_template('face_scan.html')

@app.route('/infraction')
def infraction():
    return render_template('infraction.html')

@app.route('/criminal')
def criminal():
    return render_template('criminal.html')

@app.route('/case-report')
def case_report():
    return render_template('case-report.html')

@app.route('/tempelates-page')
def tempelates_page():
    return render_template('tempelates.html')

# ------------------ API for fingerprint scan ------------------

@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()
    fp_data = data.get('fingerprint', '').strip()

    response = {"status": "not_found", "username": None, "dob": None, "details": None, "match_rate": "0%"}

    for username, info in users.items():
        if info['fingerprint'] == fp_data:
            response = {
                "status": "found",
                "username": username,
                "dob": info['dob'],
                "details": info['details'],
                "match_rate": "100%"
            }
            break

    return jsonify(response)

# ------------------ Run Server ------------------

if __name__ == '__main__':
    app.run(debug=True)
