import os
from scapy.all import IP, TCP, UDP, DNS, DNSQR, wrpcap, Raw
import random
import string

def generate_random_entropy_bytes(size=100):
    return bytes(random.getrandbits(8) for _ in range(size))

def main():
    packets = []
    
    attacker_ip = "192.168.1.105"
    target_ip = "10.0.0.50"
    
    # 1. Normal Traffic
    for _ in range(5):
        pkt = IP(src="192.168.1.20", dst=target_ip) / TCP(dport=80) / Raw(b"GET / HTTP/1.1\r\nHost: example.com\r\n\r\n")
        packets.append(pkt)

    # 2. Port Scan (Attacker checking ports 1 to 50)
    for port in range(1, 51):
        pkt = IP(src=attacker_ip, dst=target_ip) / TCP(dport=port, flags="S")
        packets.append(pkt)
        
    # 3. SQL Injection Attempt
    sql_payload = b"GET /login?user=admin' UNION SELECT * FROM users-- HTTP/1.1\r\n\r\n"
    pkt_sql = IP(src=attacker_ip, dst=target_ip) / TCP(dport=80) / Raw(sql_payload)
    packets.append(pkt_sql)
    
    # 4. High Entropy C2 Communication (Unusual port, random bytes)
    c2_payload = generate_random_entropy_bytes(250)
    pkt_c2 = IP(src=attacker_ip, dst="185.220.101.34") / TCP(dport=4444) / Raw(c2_payload)
    packets.append(pkt_c2)
    
    # 5. DNS Tunneling (Very long subdomain)
    long_subdomain = "".join(random.choices(string.ascii_lowercase + string.digits, k=60)) + ".evil-domain.com"
    pkt_dns = IP(src=attacker_ip, dst="8.8.8.8") / UDP(dport=53) / DNS(rd=1, qd=DNSQR(qname=long_subdomain))
    packets.append(pkt_dns)

    output_file = "sample_threats.pcap"
    wrpcap(output_file, packets)
    print(f"Successfully generated {output_file} with {len(packets)} packets.")
    
if __name__ == "__main__":
    main()
