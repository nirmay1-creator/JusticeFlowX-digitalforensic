def calculate_threat_score(
    entropy_info: dict, 
    suspicious_apis: list, 
    yara_matches: list, 
    ioc_strings: dict,
    pcap_info: dict = None
) -> tuple[float, str]:
    """
    Calculate a threat score (0-100) and severity based on extracted features.
    
    Returns:
        (score: float, severity: str)
    """
    score = 0.0
    
    # Entropy / Packing
    if entropy_info.get("entropy", 0) > 7.0:
        score += 20.0
    if entropy_info.get("is_packed", False):
        score += 15.0
        
    # APIs
    for api in suspicious_apis:
        sev = api.get("severity", "LOW")
        if sev == "CRITICAL":
            score += 8.0
        elif sev == "HIGH":
            score += 5.0
        elif sev == "MEDIUM":
            score += 2.0
            
    # YARA
    for match in yara_matches:
        sev = match.get("severity", "MEDIUM")
        if sev == "CRITICAL":
            score += 25.0
        elif sev == "HIGH":
            score += 15.0
        elif sev == "MEDIUM":
            score += 10.0
        else:
            score += 5.0
            
    # IOCs
    if len(ioc_strings.get("urls", [])) > 0:
        score += 5.0
    if len(ioc_strings.get("ips", [])) > 0:
        score += 5.0
    if len(ioc_strings.get("commands", [])) > 0:
        score += 10.0
        
    # PCAP Behaviors
    if pcap_info and "error" not in pcap_info:
        for behavior in pcap_info.get("behaviors", []):
            sev = behavior.get("severity", "LOW")
            if sev == "CRITICAL":
                score += 20.0
            elif sev == "HIGH":
                score += 15.0
            elif sev == "MEDIUM":
                score += 5.0

    # Cap at 100
    score = min(100.0, score)
    
    # Severity Mapping
    if score <= 25:
        severity = "CLEAN"
    elif score <= 40:
        severity = "LOW"
    elif score <= 60:
        severity = "MEDIUM"
    elif score <= 80:
        severity = "HIGH"
    else:
        severity = "CRITICAL"
        
    return score, severity
