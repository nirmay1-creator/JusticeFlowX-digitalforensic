import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class AnalysisJob(Base):
    """A single malware analysis job."""

    __tablename__ = "analysis_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))

    # File metadata
    original_filename = Column(String(512), nullable=False)
    stored_filename = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    mime_type = Column(String(256), default="unknown")
    file_type = Column(String(64), default="unknown")  # PE, ELF, PDF, etc.

    # Hashes
    md5 = Column(String(32))
    sha1 = Column(String(40))
    sha256 = Column(String(64))
    sha512 = Column(String(128))

    # Status
    status = Column(String(20), nullable=False, default="queued")  # queued | processing | completed | failed
    error_message = Column(Text, nullable=True)

    # Results (stored as JSON blob)
    result_json = Column(JSON, nullable=True)

    # Threat assessment
    threat_score = Column(Float, default=0.0)
    severity = Column(String(20), default="UNKNOWN")

    # Timestamps
    created_at = Column(DateTime, default=_utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    yara_matches = relationship("YaraMatch", back_populates="job", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "job_id": self.job_id,
            "original_filename": self.original_filename,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "file_type": self.file_type,
            "md5": self.md5,
            "sha1": self.sha1,
            "sha256": self.sha256,
            "sha512": self.sha512,
            "status": self.status,
            "error_message": self.error_message,
            "result_json": self.result_json,
            "threat_score": self.threat_score,
            "severity": self.severity,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "yara_matches": [m.to_dict() for m in self.yara_matches],
        }


class YaraMatch(Base):
    """A single YARA rule match against an analysis job."""

    __tablename__ = "yara_matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(36), ForeignKey("analysis_jobs.job_id"), nullable=False)
    rule_name = Column(String(256), nullable=False)
    category = Column(String(128), default="unknown")
    severity = Column(String(20), default="MEDIUM")
    description = Column(Text, default="")
    matched_strings = Column(JSON, nullable=True)

    job = relationship("AnalysisJob", back_populates="yara_matches")

    def to_dict(self):
        return {
            "rule_name": self.rule_name,
            "category": self.category,
            "severity": self.severity,
            "description": self.description,
            "matched_strings": self.matched_strings,
        }
