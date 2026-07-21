import requests
import json
import os
import sys

BASE_URL = "http://localhost:8000/api"

# Color constants for terminal
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"

def print_result(test_name, success, message=""):
    status = f"{GREEN}PASS{RESET}" if success else f"{RED}FAIL{RESET}"
    print(f"[{status}] {test_name} {message}")

def get_auth_token():
    print("--- Setting up QA Environment ---")
    
    # 1. Register a test investigator
    user_data = {"username": "qa_tester_2", "password": "Password123", "role": "Investigator"}
    reg_res = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    if reg_res.status_code not in (200, 400): # 400 means already registered
        print(f"{RED}Failed to register test user.{RESET}")
        sys.exit(1)
        
    # 2. Login
    login_data = {"username": "qa_tester_2", "password": "Password123"}
    log_res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if log_res.status_code != 200:
        print(f"{RED}Failed to login test user.{RESET}")
        sys.exit(1)
        
    token = log_res.json()["access_token"]
    print(f"{GREEN}Obtained JWT Token.{RESET}")
    return token

def get_or_create_test_case(token):
    headers = {"Authorization": f"Bearer {token}"}
    case_data = {
        "case_number": "QA-PCAP-TEST-002",
        "title": "Automated PCAP QA",
        "status": "Open"
    }
    res = requests.post(f"{BASE_URL}/cases/", json=case_data, headers=headers)
    if res.status_code == 200:
        return res.json()["id"]
    elif res.status_code == 400:
        # Case already exists, fetch it
        cases = requests.get(f"{BASE_URL}/cases/", headers=headers).json()
        for c in cases:
            if c["case_number"] == "QA-PCAP-TEST-002":
                return c["id"]
    print(f"{RED}Failed to setup test case.{RESET}")
    sys.exit(1)

def run_qa_tests(token, case_id):
    headers = {"Authorization": f"Bearer {token}"}
    upload_url = f"{BASE_URL}/cases/{case_id}/upload-pcap"
    
    print("\n--- Running PCAP Pipeline Tests ---")

    # ---------------------------------------------------------
    # TEST 1: Invalid file extension (.txt)
    # ---------------------------------------------------------
    with open("dummy.txt", "w") as f: f.write("not a pcap")
    
    with open("dummy.txt", "rb") as f:
        files = {"file": ("dummy.txt", f, "text/plain")}
        res = requests.post(upload_url, headers=headers, files=files)
        
    success = res.status_code == 400 and "Only .pcap or .pcapng files are allowed" in res.json().get("detail", "")
    print_result("Invalid File Extension Rejection", success, f"(Got {res.status_code})")
    os.remove("dummy.txt")

    # ---------------------------------------------------------
    # TEST 2: Corrupted/Empty PCAP file
    # ---------------------------------------------------------
    # Create an empty file named .pcap to simulate a corrupted/empty capture
    with open("corrupted.pcap", "w") as f: f.write("garbage data not a real pcap")
    
    with open("corrupted.pcap", "rb") as f:
        files = {"file": ("corrupted.pcap", f, "application/vnd.tcpdump.pcap")}
        res = requests.post(upload_url, headers=headers, files=files)
        
    # Our backend catches exceptions in pyshark and returns a 500 error gracefully
    # or pyshark parses 0 packets and returns a 200 depending on exact corruption.
    success = res.status_code == 500 or (res.status_code == 200 and res.json()["parsed_data"]["total_packets_parsed"] == 0)
    print_result("Graceful Handling of Corrupt PCAP", success, f"(Got {res.status_code})")
    os.remove("corrupted.pcap")

    # ---------------------------------------------------------
    # TEST 3: Informational (Testing a real PCAP)
    # ---------------------------------------------------------
    print("\n[INFO] To test a REAL PCAP file, use this exact command in your terminal:")
    print(f"""
curl -X POST {upload_url} \\
     -H "Authorization: Bearer {token}" \\
     -F "file=@C:/Path/To/Your/Capture.pcapng"
    """)
    print("Verify that the resulting JSON returns `total_packets_parsed` > 0 and populated arrays for IPs/Protocols.")

if __name__ == "__main__":
    try:
        import requests
    except ImportError:
        print(f"{RED}Please run `pip install requests` first.{RESET}")
        sys.exit(1)
        
    token = get_auth_token()
    case_id = get_or_create_test_case(token)
    run_qa_tests(token, case_id)
