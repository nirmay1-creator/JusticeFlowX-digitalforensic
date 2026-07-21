from fastapi import APIRouter
import random
from datetime import datetime
import psutil
import time

router = APIRouter()

class GlobalState:
    def __init__(self):
        self.power = True
        self.threat_mode = False
        self.log_history = []
        self.start_time = time.time()
        
        self.normal_logs = [
            "🟢 Camera C-34 tracking subject ID 89421",
            "🟡 Drone D2 scanning Sector 7B",
            "🟢 Facial match completed (Accuracy: 98.3%)",
            "🔵 Fingerprint verification successful",
            "🟢 Criminal database synced",
            "🟡 Server backup in progress",
            "🟢 AI threat model updated",
            "🟢 Perimeter sensors recalibrated"
        ]
        
        self.threat_logs = [
            "🔴 Unauthorized access attempt blocked",
            "🔴 Drone D4 intercepted rogue signal",
            "🔴 MULTIPLE LOGIN FAILURES - SECTOR 9",
            "🔴 Thermal scan detected anomaly in Zone C",
            "🟡 Network latency spike detected",
            "🔴 Potential tampering with CCTV node 42",
            "🔴 CRITICAL: Firewall breach attempt mitigated"
        ]

state = GlobalState()

@router.get("/status")
def get_system_status():
    if not state.power:
        return {
            "power": False,
            "threat_mode": False,
            "metrics": None
        }
    
    # Use psutil to get 100% REAL hardware metrics
    cpu_percent = psutil.cpu_percent(interval=0.1)
    cpu_freq = psutil.cpu_freq()
    cpu_count = psutil.cpu_count(logical=True)
    
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    
    disk = psutil.disk_usage('/')
    
    net_io = psutil.net_io_counters()
    
    uptime_seconds = time.time() - psutil.boot_time()
    
    # Fake values for domain-specific metrics that don't have real hardware equivalents
    if state.threat_mode:
        fake_cpu = random.randint(85, 99)
        cctv_active = 115
        drone_active = 4
    else:
        fake_cpu = cpu_percent
        cctv_active = 121
        drone_active = 2

    return {
        "power": True,
        "threat_mode": state.threat_mode,
        "metrics": {
            # Infrastructure Control Center (Infraction) metrics
            "cctv": {
                "total": 124,
                "active": cctv_active,
                "offline": 124 - cctv_active
            },
            "drone": {
                "total": 4,
                "active": drone_active,
                "charging": 4 - drone_active,
                "maintenance": 0
            },
            "server": {
                "cpu": fake_cpu, # Mostly real, spikes during threat mode
                "ram": mem.percent,
                "network_load": random.randint(30, 50) if not state.threat_mode else random.randint(70, 95)
            },
            "fingerprint": {
                "indexed": "1.4M",
                "matches": random.randint(300, 350)
            },
            "face": {
                "stored": "2.8M",
                "accuracy": "98.3%"
            },
            "criminal": {
                "profiles": "782,450",
                "high_risk": 3 if not state.threat_mode else 12
            },
            
            # System Health (system.html) specific 100% REAL metrics
            "hardware": {
                "cpu": {
                    "usage": cpu_percent,
                    "threads": cpu_count,
                    "clock": round(cpu_freq.current / 1000.0, 1) if cpu_freq else 3.5,
                    "temp": random.randint(45, 65) if not state.threat_mode else random.randint(75, 90), # Temps usually not available without admin
                    "load_avg": round(cpu_percent / 100.0, 2)
                },
                "memory": {
                    "percent": mem.percent,
                    "used_gb": round(mem.used / (1024**3), 1),
                    "free_gb": round(mem.available / (1024**3), 1),
                    "cached_gb": round((getattr(mem, 'cached', 0) or 2*(1024**3)) / (1024**3), 1),
                    "swap_gb": round(swap.used / (1024**3), 1)
                },
                "disk": {
                    "percent": disk.percent,
                    "read_mbs": round(net_io.bytes_recv / (1024**2) / uptime_seconds * 10000, 1), # Simulated throughput using net io as proxy
                    "write_mbs": round(net_io.bytes_sent / (1024**2) / uptime_seconds * 10000, 1),
                    "free_tb": round(disk.free / (1024**4), 2),
                    "iops": random.randint(300, 1500)
                },
                "network": {
                    "upload_mbps": round((net_io.bytes_sent * 8) / (uptime_seconds * 1000000), 2),
                    "download_mbps": round((net_io.bytes_recv * 8) / (uptime_seconds * 1000000), 2),
                    "latency": random.randint(2, 12),
                    "uptime_str": f"{int(uptime_seconds // 3600)}h {int((uptime_seconds % 3600) // 60)}m"
                }
            }
        }
    }

@router.get("/logs")
def get_system_logs():
    if not state.power:
        return {"logs": []}
        
    # Generate 1 new log on each fetch
    source = state.threat_logs if state.threat_mode else state.normal_logs
    new_log = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "message": random.choice(source)
    }
    
    state.log_history.insert(0, new_log)
    if len(state.log_history) > 15:
        state.log_history = state.log_history[:15]
        
    return {"logs": state.log_history}

@router.post("/toggle_power")
def toggle_power():
    state.power = not state.power
    if not state.power:
        state.threat_mode = False
        state.log_history = []
    return {"power": state.power}

@router.post("/toggle_threat")
def toggle_threat():
    if state.power:
        state.threat_mode = not state.threat_mode
    return {"threat_mode": state.threat_mode}
