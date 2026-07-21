"""
Upload security: file validation, MIME checking, and type detection.
"""

import os
import uuid
import magic
from werkzeug.utils import secure_filename
from ..config import settings


# Mapping of MIME types to our internal file type labels
MIME_TYPE_MAP = {
    "application/x-dosexec": "PE",
    "application/x-executable": "PE",
    "application/x-msi": "PE",
    "application/x-elf": "ELF",
    "application/x-sharedlib": "ELF",
    "application/vnd.android.package-archive": "APK",
    "application/pdf": "PDF",
    "application/msword": "Office",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Office",
    "application/vnd.ms-excel": "Office",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Office",
    "application/zip": "Archive",
    "application/x-rar-compressed": "Archive",
    "application/x-7z-compressed": "Archive",
    "application/gzip": "Archive",
    "application/x-tar": "Archive",
    "application/vnd.tcpdump.pcap": "PCAP",
    "application/octet-stream": "Binary",
    "text/x-shellscript": "Script",
    "text/plain": "Text",
}


def validate_upload(filename: str, file_size: int) -> tuple[bool, str]:
    """
    Validate uploaded file against size and extension rules.

    Returns:
        (is_valid, error_message)
    """
    if not filename:
        return False, "No filename provided."

    _, ext = os.path.splitext(filename.lower())

    if ext not in settings.ALLOWED_EXTENSIONS:
        return False, f"File extension '{ext}' is not allowed."

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        return False, f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB} MB."

    return True, ""


def sanitize_filename(original: str) -> str:
    """
    Generate a safe, unique filename for disk storage.
    Format: <uuid>_<secure_original_name>
    """
    safe = secure_filename(original) or "unnamed"
    return f"{uuid.uuid4().hex}_{safe}"


def detect_file_type(file_path: str) -> tuple[str, str]:
    """
    Detect MIME type and our internal file-type label using libmagic.

    Returns:
        (mime_type, file_type_label)
    """
    try:
        mime = magic.from_file(file_path, mime=True)
    except Exception:
        mime = "application/octet-stream"

    file_type = MIME_TYPE_MAP.get(mime, "Unknown")

    # Fallback: check extension if magic returns generic octet-stream
    if file_type in ("Binary", "Unknown"):
        _, ext = os.path.splitext(file_path.lower())
        ext_map = {
            ".exe": "PE", ".dll": "PE", ".sys": "PE", ".scr": "PE",
            ".elf": "ELF",
            ".apk": "APK",
            ".pdf": "PDF",
            ".pcap": "PCAP", ".pcapng": "PCAP",
            ".ps1": "Script", ".bat": "Script", ".cmd": "Script",
            ".vbs": "Script", ".js": "Script",
        }
        file_type = ext_map.get(ext, file_type)

    return mime, file_type
