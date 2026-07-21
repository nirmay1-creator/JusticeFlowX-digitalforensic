"""
Multi-algorithm file hashing engine.
Computes MD5, SHA-1, SHA-256, and SHA-512 in a single streaming pass.
"""

import hashlib


def compute_hashes(file_path: str, chunk_size: int = 65536) -> dict:
    """
    Read a file once and compute all four hash digests simultaneously.

    Args:
        file_path: Absolute path to the file on disk.
        chunk_size: Read buffer size (default 64 KB).

    Returns:
        Dict with keys: md5, sha1, sha256, sha512.
    """
    md5 = hashlib.md5()
    sha1 = hashlib.sha1()
    sha256 = hashlib.sha256()
    sha512 = hashlib.sha512()

    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            md5.update(chunk)
            sha1.update(chunk)
            sha256.update(chunk)
            sha512.update(chunk)

    return {
        "md5": md5.hexdigest(),
        "sha1": sha1.hexdigest(),
        "sha256": sha256.hexdigest(),
        "sha512": sha512.hexdigest(),
    }
