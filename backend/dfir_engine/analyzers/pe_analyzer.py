import pefile
from datetime import datetime

def analyze_pe(file_path: str) -> dict:
    try:
        pe = pefile.PE(file_path)
    except Exception as e:
        return {"error": f"Failed to parse PE: {e}"}

    result = {}
    
    # Architecture
    machine = pe.FILE_HEADER.Machine
    if machine == 0x14C:
        result["architecture"] = "x86"
    elif machine == 0x8664:
        result["architecture"] = "x64"
    else:
        result["architecture"] = f"Unknown (0x{machine:04X})"

    # Timestamp
    timestamp = pe.FILE_HEADER.TimeDateStamp
    try:
        result["compile_time"] = datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S UTC')
    except Exception:
        result["compile_time"] = "Invalid"

    # Entry Point
    result["entry_point"] = hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint)

    # Sections
    sections = []
    for section in pe.sections:
        sections.append({
            "name": section.Name.decode('utf-8', 'ignore').strip('\x00'),
            "virtual_address": hex(section.VirtualAddress),
            "virtual_size": section.Misc_VirtualSize,
            "raw_size": section.SizeOfRawData,
            "entropy": section.get_entropy()
        })
    result["sections"] = sections

    # Imports
    imports = []
    if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
        for entry in pe.DIRECTORY_ENTRY_IMPORT:
            dll_name = entry.dll.decode('utf-8', 'ignore') if entry.dll else "Unknown"
            funcs = []
            for imp in entry.imports:
                if imp.name:
                    funcs.append(imp.name.decode('utf-8', 'ignore'))
                elif imp.ordinal:
                    funcs.append(f"Ordinal{imp.ordinal}")
            imports.append({"dll": dll_name, "functions": funcs})
    result["imports"] = imports

    # Exports
    exports = []
    if hasattr(pe, 'DIRECTORY_ENTRY_EXPORT'):
        for exp in pe.DIRECTORY_ENTRY_EXPORT.symbols:
            if exp.name:
                exports.append(exp.name.decode('utf-8', 'ignore'))
    result["exports"] = exports
    
    pe.close()
    return result
