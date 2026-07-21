try:
    from scapy.all import rdpcap, IP, TCP, UDP, DNS
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

def analyze_pcap(file_path: str) -> dict:
    if not SCAPY_AVAILABLE:
        return {"error": "scapy is not installed. Cannot analyze PCAP."}

    try:
        # Limit the number of packets to prevent memory exhaustion
        packets = rdpcap(file_path, count=5000)
    except Exception as e:
        return {"error": f"Failed to parse PCAP: {e}"}

    protocols = {"TCP": 0, "UDP": 0, "HTTP": 0, "DNS": 0, "Unknown": 0}
    ips = set()
    dns_queries = set()

    for pkt in packets:
        if IP in pkt:
            ips.add(pkt[IP].src)
            ips.add(pkt[IP].dst)
            if TCP in pkt:
                if pkt[TCP].dport == 80 or pkt[TCP].sport == 80:
                    protocols["HTTP"] += 1
                else:
                    protocols["TCP"] += 1
            elif UDP in pkt:
                if DNS in pkt:
                    protocols["DNS"] += 1
                    if pkt[DNS].qd:
                        try:
                            dns_queries.add(pkt[DNS].qd.qname.decode('utf-8', 'ignore'))
                        except:
                            pass
                else:
                    protocols["UDP"] += 1
        else:
            protocols["Unknown"] += 1

    # Simple Heuristics
    mitre = []
    behaviors = []
    
    if protocols["DNS"] > 200:
        behaviors.append({"title": "DNS Tunneling Anomaly", "desc": "High volume of DNS queries detected", "danger": True, "severity": "HIGH"})
        mitre.append({"id": "T1071.004", "name": "DNS Tunneling", "tactic": "Command and Control", "description": "Potential data exfiltration or C2 communication via DNS records"})

    if protocols["TCP"] > 1000:
        behaviors.append({"title": "Large TCP Transfer", "desc": "High volume of TCP traffic", "danger": False, "severity": "MEDIUM"})

    if protocols["HTTP"] > 500:
        behaviors.append({"title": "High HTTP Traffic", "desc": "Large number of unencrypted HTTP packets", "danger": False, "severity": "MEDIUM"})

    iocs = {
        "ips": list(ips)[:20],
        "domains": list(dns_queries)[:20]
    }

    return {
        "protocols": [protocols["TCP"], protocols["UDP"], protocols["HTTP"], protocols["DNS"], protocols["Unknown"]],
        "iocs": iocs,
        "behaviors": behaviors,
        "mitre": mitre
    }
