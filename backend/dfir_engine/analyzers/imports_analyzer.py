API_CATEGORIES = {
    "Process Injection": {
        "severity": "CRITICAL",
        "apis": ["VirtualAlloc", "VirtualAllocEx", "WriteProcessMemory", "CreateRemoteThread", "NtCreateThreadEx", "QueueUserAPC"]
    },
    "Persistence": {
        "severity": "HIGH",
        "apis": ["RegSetValue", "RegSetValueExA", "RegSetValueExW", "RegCreateKey", "RegCreateKeyExA", "RegCreateKeyExW", "CreateServiceA", "CreateServiceW", "schtasks"]
    },
    "Execution": {
        "severity": "HIGH",
        "apis": ["WinExec", "CreateProcessA", "CreateProcessW", "ShellExecuteA", "ShellExecuteW", "system", "LoadLibraryA", "LoadLibraryW"]
    },
    "Network": {
        "severity": "MEDIUM",
        "apis": ["InternetOpenA", "InternetOpenW", "InternetOpenUrlA", "InternetOpenUrlW", "WinHttpOpen", "socket", "connect", "URLDownloadToFileA", "URLDownloadToFileW"]
    },
    "Crypto": {
        "severity": "MEDIUM",
        "apis": ["CryptEncrypt", "CryptDecrypt", "BCryptEncrypt", "BCryptDecrypt", "CryptGenKey"]
    },
    "Evasion": {
        "severity": "HIGH",
        "apis": ["IsDebuggerPresent", "CheckRemoteDebuggerPresent", "GetTickCount", "Sleep", "FindWindowA", "FindWindowW"]
    },
    "File System": {
        "severity": "LOW",
        "apis": ["CreateFileA", "CreateFileW", "WriteFile", "DeleteFileA", "DeleteFileW", "MoveFileA", "MoveFileW"]
    }
}

def analyze_imports(pe_imports: list) -> list:
    """
    Takes the 'imports' list from pe_analyzer.
    Returns a list of suspicious API matches with severities.
    """
    results = []
    
    # Flatten imported functions
    imported_funcs = set()
    for imp in pe_imports:
        for func in imp.get("functions", []):
            imported_funcs.add(func)
            
    for category, info in API_CATEGORIES.items():
        severity = info["severity"]
        for target_api in info["apis"]:
            for imp_func in imported_funcs:
                if imp_func.startswith(target_api):
                    results.append({
                        "name": imp_func,
                        "category": category,
                        "severity": severity,
                        "description": f"Commonly used for {category.lower()}"
                    })
                    break
    
    return results
