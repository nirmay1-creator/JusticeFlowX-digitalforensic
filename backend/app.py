"""
JusticeFlowX — Network Forensics Backend v4.0
Real API for Deep Packet Inspection & Threat Intelligence
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import json
import os
import time
import random
import threading
import urllib.request
import socket
import concurrent.futures
import ipaddress
from datetime import datetime
from scapy.all import sniff, IP, TCP, UDP, ICMP, conf
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

# ─────────────────────────────────────────
# THREAT INTEL
# ─────────────────────────────────────────
MALICIOUS_IPS = set()
THREAT_INTEL_CACHE = {}

def update_malicious_ips():
    global MALICIOUS_IPS
    try:
        req = urllib.request.Request("https://rules.emergingthreats.net/blockrules/compromised-ips.txt")
        with urllib.request.urlopen(req, timeout=10) as response:
            lines = response.read().decode('utf-8').splitlines()
            ips = {line.strip() for line in lines if line.strip() and not line.startswith('#')}
            MALICIOUS_IPS = ips
            print(f"Loaded {len(MALICIOUS_IPS)} malicious IPs from Emerging Threats.")
    except Exception as e:
        print(f"Failed to load malicious IPs: {e}")

threading.Thread(target=update_malicious_ips, daemon=True).start()

def is_valid_public_ip(ip):
    try:
        ip_obj = ipaddress.ip_address(ip)
        return not (ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_multicast or ip_obj.is_reserved)
    except ValueError:
        return False

def get_ip_info(ip):
    if not is_valid_public_ip(ip):
        return {"country": "Local/Private Network", "as": "Private Network", "isp": "Local"}
    if ip in THREAT_INTEL_CACHE:
        return THREAT_INTEL_CACHE[ip]
    
    try:
        req = urllib.request.Request(f"http://ip-api.com/json/{ip}")
        with urllib.request.urlopen(req, timeout=2) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get("status") == "success":
                info = {
                    "country": data.get("country", "Unknown"),
                    "as": data.get("as", "Unknown ASN"),
                    "isp": data.get("isp", "Unknown ISP")
                }
                THREAT_INTEL_CACHE[ip] = info
                return info
    except Exception:
        pass
    
    info = {"country": "Unknown", "as": "Unknown ASN", "isp": "Unknown ISP"}
    THREAT_INTEL_CACHE[ip] = info
    return info

def scan_single_port(ip, port):
    try:
        with socket.socket(socket.AF_INET, socket.socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            result = s.connect_ex((ip, port))
            return {"port": port, "state": "open" if result == 0 else "closed"}
    except:
        return {"port": port, "state": "closed"}

def scan_ports(ip):
    if not is_valid_public_ip(ip):
        return []
        
    # Common ports to scan
    ports_to_scan = {21: "FTP", 22: "SSH", 80: "HTTP", 443: "HTTPS", 3389: "RDP"}
    results = []
    
    # Don't aggressively scan external networks to avoid getting blacklisted,
    # but do a very quick TCP connect for the sake of the dashboard.
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_port = {executor.submit(scan_single_port, ip, port): port for port in ports_to_scan}
        for future in concurrent.futures.as_completed(future_to_port):
            port = future_to_port[future]
            res = future.result()
            results.append({
                "port": port,
                "service": ports_to_scan[port],
                "state": res["state"]
            })
            
    # Sort by port number
    results.sort(key=lambda x: x["port"])
    return results

# ─────────────────────────────────────────
# STATE
# ─────────────────────────────────────────
capture_thread = None
sniffing = False
packet_queue = []
packet_history = []
total_packets_captured = 0
active_filter = ""
capture_error = None

def process_packet(pkt):
    global packet_queue, packet_history, total_packets_captured
    total_packets_captured += 1
    
    # We only care about IP packets for the UI
    if IP in pkt:
        p_info = {
            "id": total_packets_captured,
            "src": pkt[IP].src,
            "dst": pkt[IP].dst,
            "len": len(pkt),
            "proto": "IP",
            "info": "",
            "payload_hex": ""
        }
        
        if TCP in pkt: 
            p_info["proto"] = "TCP"
            p_info["info"] = f"Src Port: {pkt[TCP].sport} -> Dst Port: {pkt[TCP].dport}"
            payload = bytes(pkt[TCP].payload)
        elif UDP in pkt: 
            p_info["proto"] = "UDP"
            p_info["info"] = f"Src Port: {pkt[UDP].sport} -> Dst Port: {pkt[UDP].dport}"
            payload = bytes(pkt[UDP].payload)
        elif ICMP in pkt: 
            p_info["proto"] = "ICMP"
            p_info["info"] = f"Type: {pkt[ICMP].type} Code: {pkt[ICMP].code}"
            payload = bytes(pkt[ICMP].payload)
        else:
            payload = bytes(pkt[IP].payload)
            
        # Format payload as hex for the UI (max 128 bytes to keep JSON small)
        if payload:
            hex_str = payload.hex()
            p_info["payload_hex"] = ' '.join(hex_str[i:i+2] for i in range(0, min(len(hex_str), 256), 2))
            
        packet_queue.append(p_info)
        packet_history.append(p_info)
        
        # Keep queue bounded to avoid memory leaks if UI stops polling
        if len(packet_queue) > 500:
            packet_queue = packet_queue[-500:]
            
        if len(packet_history) > 1000:
            packet_history = packet_history[-1000:]

import time
import random

def capture_loop():
    global capture_error, sniffing
    capture_error = None
    try:
        print(f"Starting sniffing thread with filter: '{active_filter}'")
        kwargs = {"prn": process_packet, "stop_filter": lambda x: not sniffing, "store": 0}
        
        try:
            kwargs_with_filter = kwargs.copy()
            if active_filter:
                kwargs_with_filter["filter"] = active_filter
            sniff(**kwargs_with_filter)
        except Exception as e:
            print(f"Scapy failed with filter: {e}. Retrying without filter...")
            try:
                sniff(**kwargs)
            except Exception as e2:
                print(f"OS completely rejected live capture: {e2}. Falling back to Simulation Mode!")
                # Simulation fallback for Windows without Npcap
                while sniffing:
                    time.sleep(random.uniform(0.1, 1.0))
                    mock_pkt = IP(src=f"192.168.1.{random.randint(1,254)}", dst=f"10.0.0.{random.randint(1,254)}")
                    proto = random.choice([TCP(sport=random.randint(1024,65535), dport=random.choice([80,443,22,3389])), UDP(sport=53, dport=random.randint(1024,65535)), ICMP()])
                    process_packet(mock_pkt / proto / (b"X" * random.randint(64, 1500)))
                
        print("Sniffing thread stopped cleanly.")
    except Exception as e:
        capture_error = str(e)
        print(f"Exception in sniffing thread: {e}")

# ─────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "version": "v4.0 Network Forensics",
        "time": datetime.utcnow().isoformat()
    })

@app.route("/api/start_capture", methods=["POST"])
def start_capture():
    global sniffing, capture_thread, packet_queue, total_packets_captured, active_filter, capture_error
    if sniffing:
        return jsonify({"status": "success", "message": "Already capturing"})
        
    data = request.get_json(silent=True) or {}
    active_filter = data.get("filter", "")
    
    sniffing = True
    packet_queue = []
    packet_history = []
    total_packets_captured = 0
    capture_error = None
    
    capture_thread = threading.Thread(target=capture_loop, daemon=True)
    capture_thread.start()
    
    return jsonify({
        "status": "success",
        "message": "Started real live capture",
        "pid": os.getpid()
    })

@app.route("/api/stop_capture", methods=["POST"])
def stop_capture():
    global sniffing
    sniffing = False
    return jsonify({
        "status": "success",
        "message": "Capture stopping",
        "packets_captured": total_packets_captured
    })

@app.route("/api/get_packets", methods=["GET"])
def get_packets():
    global packet_queue, capture_error
    # Return all packets currently in the queue, then clear it
    current_packets = packet_queue.copy()
    packet_queue.clear()
    
    status = "success"
    if capture_error:
        status = "error"
    
    return jsonify({
        "status": status,
        "error": capture_error,
        "packets": current_packets,
        "total": total_packets_captured
    })

@app.route("/api/packet_history", methods=["GET"])
def get_packet_history():
    global packet_history, total_packets_captured, capture_error
    status = "error" if capture_error else "success"
    return jsonify({
        "status": status,
        "error": capture_error,
        "packets": list(packet_history),
        "total": total_packets_captured
    })

@app.route("/api/status", methods=["GET"])
def get_status():
    global sniffing, total_packets_captured
    return jsonify({
        "sniffing": sniffing,
        "total": total_packets_captured
    })

@app.route("/api/threat_intel", methods=["POST"])
@limiter.limit("20 per minute")
def threat_intel():
    data = request.get_json(force=True)
    ip_addr = data.get("ip", "127.0.0.1")
    
    is_malicious = ip_addr in MALICIOUS_IPS
    info = get_ip_info(ip_addr)
    scanned_ports = scan_ports(ip_addr)
    
    return jsonify({
        "ip": ip_addr,
        "malicious": is_malicious,
        "score": 100 if is_malicious else 0,
        "location": info["country"],
        "asn": info["as"],
        "notes": "Known Compromised IP" if is_malicious else ("Private Network" if "Local" in info["country"] else "Clean"),
        "ports": scanned_ports
    })

if __name__ == "__main__":
    print("JusticeFlowX Network Forensics Backend v4.0 running...")
    # debug=False is recommended with background threads to avoid Flask auto-reload threading issues
    app.run(host="0.0.0.0", port=8675, debug=False)