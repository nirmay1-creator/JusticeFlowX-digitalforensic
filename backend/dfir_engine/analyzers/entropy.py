import math

def calculate_shannon_entropy(data: bytes) -> float:
    """Calculates Shannon entropy for a block of data."""
    if not data:
        return 0.0
    entropy = 0
    length = len(data)
    
    counts = [0] * 256
    for byte in data:
        counts[byte] += 1
        
    for count in counts:
        if count > 0:
            p = count / length
            entropy -= p * math.log2(p)
            
    return entropy

def analyze_entropy(file_path: str, sections_info: list = None) -> dict:
    """
    Analyzes overall file entropy and checks sections for packing heuristics.
    """
    with open(file_path, "rb") as f:
        data = f.read()
    
    file_entropy = calculate_shannon_entropy(data)
    
    result = {
        "entropy": file_entropy,
        "is_packed": False,
        "details": []
    }
    
    # Heuristics for packing
    if file_entropy > 7.2:
        result["is_packed"] = True
        result["details"].append("High overall file entropy (> 7.2).")
        
    if sections_info:
        upx_detected = False
        high_entropy_sections = 0
        for sec in sections_info:
            if "UPX" in sec.get("name", "").upper():
                upx_detected = True
            if sec.get("entropy", 0) > 7.2 and sec.get("raw_size", 0) > 1024:
                high_entropy_sections += 1
                
        if upx_detected:
            result["is_packed"] = True
            result["details"].append("UPX section names detected.")
        if high_entropy_sections > 0:
            result["is_packed"] = True
            result["details"].append(f"Found {high_entropy_sections} high-entropy sections.")

    return result
