from scapy.all import IP, TCP, UDP, DNS, DNSQR, wrpcap
import random
import time

packets = []

# 1. TCP C2 Beaconing (simulate connecting to 45.33.22.11 over port 443)
for _ in range(120):
    src_port = random.randint(1024, 65535)
    # SYN
    packets.append(IP(src="192.168.1.50", dst="45.33.22.11")/TCP(sport=src_port, dport=443, flags="S"))
    # ACK
    packets.append(IP(src="45.33.22.11", dst="192.168.1.50")/TCP(sport=443, dport=src_port, flags="A"))

# 2. DNS Tunneling (simulate over 250 requests to random subdomains)
for i in range(250):
    subdomain = f"exfil-{i}-data.g00gle-update.com"
    packets.append(IP(src="192.168.1.50", dst="8.8.8.8")/UDP(sport=random.randint(1024, 65535), dport=53)/DNS(rd=1, qd=DNSQR(qname=subdomain)))

# 3. HTTP Traffic (normal)
for _ in range(50):
    packets.append(IP(src="192.168.1.50", dst="93.184.216.34")/TCP(sport=random.randint(1024, 65535), dport=80, flags="PA"))

wrpcap(r"C:\Users\Nirmay Rinesh\Desktop\suspicious_traffic.pcap", packets)
print("PCAP generated!")
