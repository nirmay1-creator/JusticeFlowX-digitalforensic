import os
from ..config import settings

try:
    import yara
except ImportError:
    yara = None

def load_yara_rules():
    """
    Load and compile YARA rules from the rules directory.
    """
    if not yara:
        return None

    rules_dir = settings.YARA_RULES_DIR
    if not os.path.exists(rules_dir):
        return None
        
    rule_files = {}
    for filename in os.listdir(rules_dir):
        if filename.endswith('.yar') or filename.endswith('.yara'):
            rule_files[filename] = os.path.join(rules_dir, filename)
            
    if not rule_files:
        return None
        
    try:
        compiled_rules = yara.compile(filepaths=rule_files)
        return compiled_rules
    except Exception as e:
        print(f"Error compiling YARA rules: {e}")
        return None

# Compile rules once on startup
COMPILED_RULES = load_yara_rules()

def scan_file(file_path: str) -> list:
    """
    Scan a file with compiled YARA rules.
    """
    if not COMPILED_RULES:
        return []
        
    try:
        matches = COMPILED_RULES.match(file_path)
    except Exception as e:
        print(f"Error matching YARA rules: {e}")
        return []
        
    results = []
    for match in matches:
        meta = match.meta
        
        # Get matching strings (safely decoding)
        matched_strings = []
        for string_match in match.strings:
            try:
                # string_match format is usually (offset, string_identifier, string_data)
                s_data = string_match[2].decode('utf-8', 'ignore')
                if s_data not in matched_strings:
                    matched_strings.append(s_data)
            except:
                pass
                
        results.append({
            "rule_name": match.rule,
            "category": meta.get("category", "Uncategorized"),
            "severity": meta.get("severity", "MEDIUM"),
            "description": meta.get("description", "No description provided."),
            "matched_strings": matched_strings[:5] # Limit to 5 examples
        })
        
    return results
