import os
from google import genai

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

print("Fetching models...")
try:
    models = client.models.list()
    for m in models:
        print(m.name)
except Exception as e:
    print("Error listing models:", e)

try:
    print("\nTesting gemini-3.6-flash...")
    res = client.models.generate_content(model="gemini-3.6-flash", contents="Hi")
    print("gemini-3.6-flash:", res.text)
    
    print("\nTesting gemini-3.1-pro-preview...")
    res = client.models.generate_content(model="gemini-3.1-pro-preview", contents="Hi")
    print("gemini-3.1-pro-preview:", res.text)
except Exception as e:
    print("Error 2.5-flash:", e)
