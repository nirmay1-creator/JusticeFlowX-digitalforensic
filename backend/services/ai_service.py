import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# We will use google-genai which is the new SDK
client = None
if os.getenv("GEMINI_API_KEY"):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODES_PROMPTS = {
    "general": "You are JusticeGPT, a helpful and highly intelligent AI assistant specializing in digital forensics and cybersecurity, but capable of answering general questions.",
    "cyber": "You are a Cyber Analyst. Focus on security research, vulnerability analysis, and threat intelligence. Provide detailed technical insights into cyber threats.",
    "forensics": "You are a Digital Forensics Expert. Focus on evidence analysis, timeline reconstruction, and investigation assistance. Think like a forensic investigator.",
    "malware": "You are a Malware Analyst. Focus on malware behavior analysis, IOC extraction, and MITRE ATT&CK mapping. Deobfuscate and analyze malicious intent.",
    "incident": "You are an Incident Responder. Focus on attack investigation, rapid recovery recommendations, and containing breaches."
}

def get_ai_response(prompt: str, mode: str, history: list = None) -> str:
    """
    history format: [{"role": "user", "content": "..."}, {"role": "model", "content": "..."}]
    """
    if not client:
        return "System Error: GEMINI_API_KEY is not configured in the environment."
        
    system_instruction = MODES_PROMPTS.get(mode, MODES_PROMPTS["general"])
    
    contents = []
    if history:
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )
            
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)]
        )
    )
    
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2
            )
        )
        return response.text
    except Exception as e:
        return f"Error communicating with AI Core: {str(e)}"

def analyze_file_content(file_content: str, file_type: str, query: str, mode: str) -> str:
    if not client:
        return "System Error: GEMINI_API_KEY is not configured in the environment."
        
    system_instruction = MODES_PROMPTS.get(mode, MODES_PROMPTS["general"])
    
    prompt = f"Analyze this {file_type} file content based on the following user query: '{query}'\n\nFile Content:\n{file_content[:50000]}" # Limit to 50k chars for safety
    
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1
            )
        )
        return response.text
    except Exception as e:
        return f"Error analyzing file: {str(e)}"
