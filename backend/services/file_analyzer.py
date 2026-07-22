import hashlib
import io
import os
from typing import Dict, Any

try:
    import fitz # PyMuPDF
except ImportError:
    fitz = None

try:
    from scapy.all import rdpcap, IP, TCP, UDP
except ImportError:
    rdpcap = None

def get_file_hash(file_bytes: bytes) -> str:
    """Returns the MD5 hash of the file bytes."""
    return hashlib.md5(file_bytes).hexdigest()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from PDF using PyMuPDF."""
    if not fitz:
        return "Error: PyMuPDF not installed."
    
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        return f"Failed to extract text from PDF: {str(e)}"

def analyze_pcap(file_bytes: bytes) -> str:
    """Analyzes a PCAP file using Scapy and returns a summary of the traffic."""
    if not rdpcap:
        return "Error: Scapy not installed."
    
    try:
        # Write to a temporary file because rdpcap needs a file path
        temp_path = "temp_analysis.pcap"
        with open(temp_path, "wb") as f:
            f.write(file_bytes)
        
        packets = rdpcap(temp_path)
        os.remove(temp_path)
        
        summary = f"PCAP File Summary: Total Packets = {len(packets)}\n\n"
        
        # Simple extraction of IPs and Ports
        ips = set()
        for i, pkt in enumerate(packets[:100]): # Limit to first 100 for summary
            if IP in pkt:
                src = pkt[IP].src
                dst = pkt[IP].dst
                ips.add(src)
                ips.add(dst)
                
        summary += f"Unique IPs found in first 100 packets: {', '.join(ips)}\n"
        return summary
    except Exception as e:
        return f"Failed to analyze PCAP: {str(e)}"

def process_uploaded_file(filename: str, file_bytes: bytes, file_type: str) -> Dict[str, Any]:
    """Processes an uploaded file based on its type."""
    file_hash = get_file_hash(file_bytes)
    extracted_text = ""
    
    if filename.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(file_bytes)
    elif filename.endswith(".pcap") or filename.endswith(".pcapng"):
        extracted_text = analyze_pcap(file_bytes)
    elif filename.endswith(".txt") or filename.endswith(".py") or filename.endswith(".js") or filename.endswith(".log"):
        # Attempt to decode as text
        try:
            extracted_text = file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            extracted_text = "Error: Could not decode text file as UTF-8."
    else:
        extracted_text = "File type not supported for text extraction. It may be an image or binary."
        
    return {
        "filename": filename,
        "hash": file_hash,
        "type": file_type,
        "content": extracted_text,
        "size": len(file_bytes)
    }
