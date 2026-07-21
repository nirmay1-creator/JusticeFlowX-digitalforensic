import threading
import time
from scapy.all import sniff, IP, TCP, UDP, ICMP

sniffing = True
packet_queue = []
total_packets_captured = 0

def process_packet(pkt):
    global packet_queue, total_packets_captured
    total_packets_captured += 1
    
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
            
        if payload:
            hex_str = payload.hex()
            p_info["payload_hex"] = ' '.join(hex_str[i:i+2] for i in range(0, min(len(hex_str), 256), 2))
            
        packet_queue.append(p_info)
        
        if len(packet_queue) > 500:
            packet_queue = packet_queue[-500:]

def run_sniff():
    try:
        sniff(prn=process_packet, stop_filter=lambda x: not sniffing, store=0)
    except Exception as e:
        print("Error in sniff:", e)

t = threading.Thread(target=run_sniff, daemon=True)
t.start()

time.sleep(2)
print("Total after 2s:", total_packets_captured)
sniffing = False
time.sleep(1)
