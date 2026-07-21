import threading
import time
from scapy.all import sniff, IP, TCP

sniffing = True
total = 0

def process_packet(pkt):
    global total
    total += 1

def run_sniff():
    try:
        sniff(prn=process_packet, stop_filter=lambda x: not sniffing, store=0)
    except Exception as e:
        print("Error:", e)

t = threading.Thread(target=run_sniff, daemon=True)
t.start()

time.sleep(2)
print("Total after 2s:", total)
sniffing = False
time.sleep(1)
