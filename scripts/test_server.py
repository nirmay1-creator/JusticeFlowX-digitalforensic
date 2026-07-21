import requests

url = 'http://localhost:5002/api/malware/analyze'
files = {'file': open(r'C:\Users\Nirmay Rinesh\Desktop\suspicious_traffic.pcap', 'rb')}
try:
    response = requests.post(url, files=files)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)
