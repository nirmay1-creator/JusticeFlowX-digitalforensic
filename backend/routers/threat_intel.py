"""
Threat Intelligence Lookup Router — JusticeFlowX

POST /api/v1/threat-intel/lookup
Accepts { "indicator": "...", "type": "IP|DOMAIN|URL|HASH" }
Returns unified aggregated threat intelligence from multiple providers.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from enum import Enum

from database import get_db
from services.threat_intel_service import lookup

router = APIRouter(
    prefix="/api/v1/threat-intel",
    tags=["threat-intel"],
)


class IndicatorType(str, Enum):
    IP = "IP"
    DOMAIN = "DOMAIN"
    URL = "URL"
    HASH = "HASH"


class LookupRequest(BaseModel):
    indicator: str = Field(..., min_length=1, max_length=2048, description="The IP, domain, URL, or hash to look up")
    type: IndicatorType = Field(..., description="The type of indicator: IP, DOMAIN, URL, or HASH")


class ProviderResult(BaseModel):
    status: str
    detected: bool
    score: int = 0
    details: dict | None = None


class LookupResponse(BaseModel):
    indicator: str
    type: str
    is_malicious: bool
    malicious_confidence_score: int
    provider_breakdown: dict
    cached: bool = False


@router.post("/lookup", response_model=LookupResponse)
async def threat_intel_lookup(request: LookupRequest, db: Session = Depends(get_db)):
    """
    Perform a multi-provider threat intelligence lookup.

    Checks a 24-hour database cache first. On cache miss, concurrently queries
    VirusTotal, AbuseIPDB, and AlienVault OTX, aggregates the results, and
    returns a unified response.

    If all API keys are missing, returns deterministic mock data for development.
    """
    try:
        result = await lookup(
            indicator=request.indicator,
            indicator_type=request.type.value,
            db=db,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Threat intel lookup failed: {str(e)}")
