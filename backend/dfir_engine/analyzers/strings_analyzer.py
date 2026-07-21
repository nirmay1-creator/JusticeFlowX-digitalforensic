import re

# Basic Regex patterns for extraction (ASCII only)
URL_REGEX = re.compile(rb'(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?]))')
IPV4_REGEX = re.compile(rb'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b')
EMAIL_REGEX = re.compile(rb'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
REGISTRY_REGEX = re.compile(rb'(?i)(HKLM|HKCU|HKCR|HKU|HKCC|HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKEY_CLASSES_ROOT|HKEY_USERS|HKEY_CURRENT_CONFIG)\\[a-zA-Z0-9_\\\-]+')
CMD_REGEX = re.compile(rb'(?i)(cmd\.exe|powershell|wget|curl|wscript|cscript|sh|bash)')

def extract_strings(file_path: str, min_length: int = 4) -> dict:
    """
    Extracts URLs, IPs, emails, registry keys, and commands from binary files.
    """
    with open(file_path, "rb") as f:
        data = f.read()

    # Find ASCII and basic Unicode strings (UTF-16 LE)
    ascii_pattern = re.compile(b'[ -~]{' + str(min_length).encode() + b',}')
    strings = ascii_pattern.findall(data)
    
    # Often utf-16 le strings look like 'c\x00m\x00d\x00.\x00e\x00x\x00e\x00'
    utf16_pattern = re.compile(b'(?:[ -~]\x00){' + str(min_length).encode() + b',}')
    utf16_strings = utf16_pattern.findall(data)
    
    for s in utf16_strings:
        # decode by removing null bytes for searching
        strings.append(s.replace(b'\x00', b''))

    ioc_urls = set()
    ioc_ips = set()
    ioc_emails = set()
    ioc_registry = set()
    ioc_cmds = set()
    
    for s in strings:
        for match in URL_REGEX.findall(s):
            ioc_urls.add(match[0].decode('utf-8', 'ignore'))
        for match in IPV4_REGEX.findall(s):
            ip_str = match.decode('utf-8', 'ignore')
            # very basic false positive filter
            if not ip_str.startswith("0.") and not ip_str.startswith("255."):
                ioc_ips.add(ip_str)
        for match in EMAIL_REGEX.findall(s):
            ioc_emails.add(match.decode('utf-8', 'ignore'))
        for match in REGISTRY_REGEX.findall(s):
            ioc_registry.add(match.decode('utf-8', 'ignore'))
        for match in CMD_REGEX.findall(s):
            ioc_cmds.add(match.decode('utf-8', 'ignore'))
            
    return {
        "urls": list(ioc_urls),
        "ips": list(ioc_ips),
        "emails": list(ioc_emails),
        "registry": list(ioc_registry),
        "commands": list(ioc_cmds)
    }
