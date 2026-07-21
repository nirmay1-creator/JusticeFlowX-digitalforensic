import os
import math
from collections import defaultdict
from scapy.all import rdpcap, IP, TCP, UDP, DNS
from sklearn.ensemble import IsolationForest
import numpy as np

def calculate_entropy(data: bytes) -> float:
    if not data:
        return 0
    arr = np.frombuffer(data, dtype=np.uint8)
    counts = np.bincount(arr, minlength=256)
    probs = counts[counts > 0] / len(data)
    return float(-np.sum(probs * np.log2(probs)))

def analyze_pcap(file_path: str):
    """
    Parses a PCAP file, extracts features, runs Anomaly Detection,
    and returns a Threat Report.
    """
    packets = rdpcap(file_path)
    
    # Tracking metrics
    ip_connections = defaultdict(int)
    port_scan_tracker = defaultdict(set)
    payload_sizes = defaultdict(int)
    dns_queries = defaultdict(int)
    
    # Heuristic flags
    detections = {
        "port_scanning": False,
        "ddos_traffic": False,
        "malware_communication": False,
        "data_exfiltration": False,
        "sql_injection": False,
        "c2_communication": False,
        "dns_tunneling": False
    }
    
    features_list = []
    suspicious_ips = defaultdict(lambda: {"score": 0, "target": None, "attack_type": "Unknown", "attempts": 0})
    
    sql_signatures = [b"UNION SELECT", b"1=1", b"DROP TABLE", b"SELECT * FROM"]
    
    for pkt in packets:
        if IP in pkt:
            src = pkt[IP].src
            dst = pkt[IP].dst
            ip_connections[src] += 1
            
            # Extract basic features for ML
            pkt_len = len(pkt)
            entropy = 0
            
            if TCP in pkt:
                port_scan_tracker[src].add(pkt[TCP].dport)
                if pkt[TCP].payload:
                    raw_payload = bytes(pkt[TCP].payload)
                    entropy = calculate_entropy(raw_payload)
                    payload_sizes[src] += len(raw_payload)
                    
                    # SQL Injection check
                    for sig in sql_signatures:
                        if sig in raw_payload.upper():
                            detections["sql_injection"] = True
                            suspicious_ips[src]["score"] += 50
                            suspicious_ips[src]["attack_type"] = "SQL Injection Attempt"
                            suspicious_ips[src]["target"] = dst
                            
                    # C2 / Malware comms check (High entropy over unusual ports)
                    if pkt[TCP].dport not in [80, 443, 22, 53] and entropy > 7.0:
                        detections["c2_communication"] = True
                        suspicious_ips[src]["score"] += 30
                        suspicious_ips[src]["attack_type"] = "C2 / Malware Communication"
                        suspicious_ips[src]["target"] = dst

            elif UDP in pkt:
                if DNS in pkt and pkt[DNS].qd:
                    qname = pkt[DNS].qd.qname.decode('utf-8', errors='ignore')
                    dns_queries[src] += 1
                    # DNS Tunneling check (very long subdomains)
                    if len(qname) > 50:
                        detections["dns_tunneling"] = True
                        suspicious_ips[src]["score"] += 40
                        suspicious_ips[src]["attack_type"] = "Suspicious DNS Tunneling"
                        suspicious_ips[src]["target"] = dst

            features_list.append([pkt_len, entropy])
            suspicious_ips[src]["attempts"] += 1
            if not suspicious_ips[src]["target"]:
                suspicious_ips[src]["target"] = dst
                
    # Detect Port Scanning & DDoS via heuristics
    for src, ports in port_scan_tracker.items():
        if len(ports) > 20:
            detections["port_scanning"] = True
            suspicious_ips[src]["score"] += 40
            if suspicious_ips[src]["attack_type"] == "Unknown":
                suspicious_ips[src]["attack_type"] = "Port Scanning"
                
    for src, count in ip_connections.items():
        if count > 1000:
            detections["ddos_traffic"] = True
            suspicious_ips[src]["score"] += 50
            suspicious_ips[src]["attack_type"] = "DDoS / Flood Attack"
            
    for src, size in payload_sizes.items():
        if size > 1024 * 1024:  # > 1MB in this short capture
            detections["data_exfiltration"] = True
            suspicious_ips[src]["score"] += 40
            if suspicious_ips[src]["attack_type"] == "Unknown":
                suspicious_ips[src]["attack_type"] = "Data Exfiltration"

    # ML Anomaly Detection (Isolation Forest)
    if len(features_list) > 10:
        clf = IsolationForest(contamination=0.05, random_state=42)
        preds = clf.fit_predict(features_list)
        # If any packet is an anomaly, increase overall confidence
        anomalies = list(preds).count(-1)
        if anomalies > 0:
            detections["malware_communication"] = True # Generic flag for ML anomalies
    
    # Determine top threat
    top_threat = None
    max_score = 0
    for src, data in suspicious_ips.items():
        if data["score"] > max_score:
            max_score = data["score"]
            top_threat = {
                "attack": data["attack_type"],
                "source": src,
                "target": data["target"],
                "attempts": data["attempts"],
                "confidence": min(99, 50 + data["score"] + (10 if detections["malware_communication"] else 0))
            }
            
    if not top_threat:
        top_threat = {
            "attack": "No significant threat detected",
            "source": "N/A",
            "target": "N/A",
            "attempts": len(packets),
            "confidence": 0
        }
        
    return {
        "report": top_threat,
        "detections": detections
    }
