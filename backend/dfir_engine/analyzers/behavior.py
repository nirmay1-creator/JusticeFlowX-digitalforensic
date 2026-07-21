TECHNIQUES = [
    {"id": "T1055", "name": "Process Injection", "tactic": "Defense Evasion, Privilege Escalation", "triggers": ["VirtualAlloc", "VirtualAllocEx", "WriteProcessMemory", "CreateRemoteThread"]},
    {"id": "T1547", "name": "Boot or Logon Autostart Execution", "tactic": "Persistence, Privilege Escalation", "triggers": ["RegSetValue", "RegCreateKey"]},
    {"id": "T1059", "name": "Command and Scripting Interpreter", "tactic": "Execution", "triggers": ["cmd.exe", "powershell", "wscript"]},
    {"id": "T1071", "name": "Application Layer Protocol", "tactic": "Command and Control", "triggers": ["InternetOpen", "WinHttpOpen", "URLDownloadToFile"]},
    {"id": "T1140", "name": "Deobfuscate/Decode Files or Information", "tactic": "Defense Evasion", "triggers": ["CryptDecrypt"]},
    {"id": "T1486", "name": "Data Encrypted for Impact", "tactic": "Impact", "triggers": ["CryptEncrypt", "BCryptEncrypt"]},
    {"id": "T1012", "name": "Query Registry", "tactic": "Discovery", "triggers": ["RegQueryValue", "RegOpenKey"]},
    {"id": "T1106", "name": "Native API", "tactic": "Execution", "triggers": ["LoadLibrary", "GetProcAddress"]},
    {"id": "T1562", "name": "Impair Defenses", "tactic": "Defense Evasion", "triggers": ["IsDebuggerPresent", "CheckRemoteDebuggerPresent"]},
]

def map_mitre(suspicious_apis: list, ioc_strings: dict) -> list:
    """
    Map extracted indicators to MITRE ATT&CK techniques.
    """
    detected_techniques = []
    
    api_names = [api["name"] for api in suspicious_apis]
    commands = ioc_strings.get("commands", [])
    
    all_indicators = api_names + commands
    
    for tech in TECHNIQUES:
        matched = False
        for trigger in tech["triggers"]:
            for ind in all_indicators:
                if trigger.lower() in ind.lower():
                    detected_techniques.append({
                        "id": tech["id"],
                        "name": tech["name"],
                        "tactic": tech["tactic"],
                        "description": f"Triggered by '{ind}'"
                    })
                    matched = True
                    break
            if matched:
                break
                
    return detected_techniques
