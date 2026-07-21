import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


class Settings(BaseSettings):
    """DFIR Engine configuration."""

    # --- Paths ---
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "dfir_uploads")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "dfir_reports")
    YARA_RULES_DIR: str = os.path.join(os.path.dirname(__file__), "rules")
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'dfir_engine.db')}"

    # --- Upload Limits ---
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: set = {
        ".exe", ".dll", ".sys", ".bin", ".elf",
        ".apk", ".pdf", ".doc", ".docx", ".xls", ".xlsx",
        ".zip", ".rar", ".7z", ".tar", ".gz",
        ".pcap", ".pcapng",
        ".js", ".vbs", ".ps1", ".bat", ".cmd",
        ".msi", ".scr", ".cpl",
    }

    # --- CORS ---
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS", "http://localhost,http://127.0.0.1"
    )

    # --- Rate Limits ---
    UPLOAD_RATE_LIMIT: str = "10/minute"

    class Config:
        env_prefix = "DFIR_"


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
