import urllib.request
import json
import time
import uuid

url = 'http://127.0.0.1:5003/api/dfir/upload'
boundary = uuid.uuid4().hex
data = b'--' + boundary.encode() + b'\r\n'
data += b'Content-Disposition: form-data; name="file"; filename="test_evidence.exe"\r\n'
data += b'Content-Type: application/octet-stream\r\n\r\n'
with open('../test_evidence.exe', 'rb') as f:
    data += f.read()
data += b'\r\n--' + boundary.encode() + b'--\r\n'

req = urllib.request.Request(url, data=data)
req.add_header('Content-Type', 'multipart/form-data; boundary=' + boundary)

with urllib.request.urlopen(req) as res:
    resp = json.loads(res.read().decode())
    print('Upload:', resp)
    job_id = resp.get('job_id')

req2 = urllib.request.Request(f'http://127.0.0.1:5003/api/dfir/analyze/{job_id}', method='POST')
with urllib.request.urlopen(req2) as res2:
    print('Analyze trigger:', json.loads(res2.read().decode()))

for _ in range(5):
    time.sleep(1)
    with urllib.request.urlopen(f'http://127.0.0.1:5003/api/dfir/analysis/{job_id}') as res3:
        status = json.loads(res3.read().decode())
        print('Status:', status['status'])
        if status['status'] in ('completed', 'failed'):
            print('Result:', status)
            break
