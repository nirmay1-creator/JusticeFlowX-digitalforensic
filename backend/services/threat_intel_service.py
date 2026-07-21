"""
Threat Intelligence Aggregation Service — JusticeFlowX

Concurrently queries VirusTotal, AbuseIPDB, and AlienVault OTX, aggregates
results into a unified response, and caches them in PostgreSQL with a 24-hour TTL.
"""

import os
import asyncio
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

import models

logger = logging.getLogger(__name__)

# ─── API Keys from environment ────────────────────────────────────────────────
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY", "")
OTX_API_KEY = os.getenv("OTX_API_KEY", "")

MOCK_MODE = os.getenv("THREAT_INTEL_MOCK_MODE", "false").lower() == "true"

CACHE_TTL_HOURS = 24
HTTP_TIMEOUT = 15.0  # seconds per provider request


# ═══════════════════════════════════════════════════════════════════════════════
# PROVIDER QUERY FUNCTIONS (each returns a standardised dict)
# ═══════════════════════════════════════════════════════════════════════════════

async def _query_virustotal(indicator: str, indicator_type: str) -> dict:
    """Query VirusTotal v3 API."""
    result = {"provider": "virustotal", "status": "skipped", "detected": False, "score": 0, "details": None}

    if not VIRUSTOTAL_API_KEY:
        result["status"] = "no_api_key"
        return result

    headers = {"x-apikey": VIRUSTOTAL_API_KEY, "Accept": "application/json"}
    base = "https://www.virustotal.com/api/v3"

    # Build the right endpoint per indicator type
    if indicator_type == "IP":
        url = f"{base}/ip_addresses/{indicator}"
    elif indicator_type == "DOMAIN":
        url = f"{base}/domains/{indicator}"
    elif indicator_type == "URL":
        # VT requires a base64url-encoded URL id
        url_id = hashlib.sha256(indicator.encode()).hexdigest()
        url = f"{base}/urls/{url_id}"
    elif indicator_type == "HASH":
        url = f"{base}/files/{indicator}"
    else:
        result["status"] = "unsupported_type"
        return result

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
            malicious_count = stats.get("malicious", 0)
            total_engines = sum(stats.values()) if stats else 1

            score = int((malicious_count / max(total_engines, 1)) * 100)
            result["status"] = "success"
            result["detected"] = score > 10
            result["score"] = score
            result["details"] = {
                "malicious_engines": malicious_count,
                "total_engines": total_engines,
                "reputation": data.get("data", {}).get("attributes", {}).get("reputation", "N/A"),
            }
    except httpx.TimeoutException:
        result["status"] = "timeout"
        logger.warning("VirusTotal request timed out for %s", indicator)
    except httpx.HTTPStatusError as e:
        result["status"] = f"http_error_{e.response.status_code}"
        logger.error("VirusTotal HTTP error for %s: %s", indicator, e.response.status_code)
    except Exception as e:
        result["status"] = "error"
        logger.error("VirusTotal unexpected error for %s: %s", indicator, e)

    return result


async def _query_abuseipdb(indicator: str, indicator_type: str) -> dict:
    """Query AbuseIPDB — IP lookups only."""
    result = {"provider": "abuseipdb", "status": "skipped", "detected": False, "score": 0, "details": None}

    if indicator_type != "IP":
        result["status"] = "not_applicable"
        return result

    if not ABUSEIPDB_API_KEY:
        result["status"] = "no_api_key"
        return result

    headers = {"Accept": "application/json", "Key": ABUSEIPDB_API_KEY}
    params = {"ipAddress": indicator, "maxAgeInDays": "90"}

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(
                "https://api.abuseipdb.com/api/v2/check",
                headers=headers,
                params=params,
            )
            resp.raise_for_status()
            data = resp.json().get("data", {})

            score = data.get("abuseConfidenceScore", 0)
            result["status"] = "success"
            result["detected"] = score > 50
            result["score"] = score
            result["details"] = {
                "total_reports": data.get("totalReports", 0),
                "country_code": data.get("countryCode", "N/A"),
                "isp": data.get("isp", "N/A"),
                "usage_type": data.get("usageType", "N/A"),
            }
    except httpx.TimeoutException:
        result["status"] = "timeout"
        logger.warning("AbuseIPDB request timed out for %s", indicator)
    except httpx.HTTPStatusError as e:
        result["status"] = f"http_error_{e.response.status_code}"
        logger.error("AbuseIPDB HTTP error for %s: %s", indicator, e.response.status_code)
    except Exception as e:
        result["status"] = "error"
        logger.error("AbuseIPDB unexpected error for %s: %s", indicator, e)

    return result


async def _query_alienvault(indicator: str, indicator_type: str) -> dict:
    """Query AlienVault OTX DirectConnect API."""
    result = {"provider": "alienvault", "status": "skipped", "detected": False, "score": 0, "details": None}

    if not OTX_API_KEY:
        result["status"] = "no_api_key"
        return result

    headers = {"X-OTX-API-KEY": OTX_API_KEY, "Accept": "application/json"}
    base = "https://otx.alienvault.com/api/v1/indicators"

    type_map = {"IP": "IPv4", "DOMAIN": "domain", "URL": "url", "HASH": "file"}
    otx_type = type_map.get(indicator_type)
    if not otx_type:
        result["status"] = "unsupported_type"
        return result

    url = f"{base}/{otx_type}/{indicator}/general"

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            pulse_count = data.get("pulse_info", {}).get("count", 0)
            # Score: each pulse contributes ~20 points (capped at 100)
            score = min(pulse_count * 20, 100)
            result["status"] = "success"
            result["detected"] = pulse_count > 0
            result["score"] = score
            result["details"] = {
                "pulse_count": pulse_count,
                "country": data.get("country_name", "N/A"),
                "asn": data.get("asn", "N/A"),
            }
    except httpx.TimeoutException:
        result["status"] = "timeout"
        logger.warning("AlienVault request timed out for %s", indicator)
    except httpx.HTTPStatusError as e:
        result["status"] = f"http_error_{e.response.status_code}"
        logger.error("AlienVault HTTP error for %s: %s", indicator, e.response.status_code)
    except Exception as e:
        result["status"] = "error"
        logger.error("AlienVault unexpected error for %s: %s", indicator, e)

    return result


# ═══════════════════════════════════════════════════════════════════════════════
# MOCK DATA GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

def _generate_mock_result(indicator: str, indicator_type: str) -> dict:
    """Deterministic mock data for development/testing without API keys."""
    # Use the last character of the indicator to generate a deterministic score
    seed = sum(ord(c) for c in indicator) % 100
    is_mal = seed > 60

    return {
        "indicator": indicator,
        "type": indicator_type,
        "is_malicious": is_mal,
        "malicious_confidence_score": seed if is_mal else max(0, seed - 30),
        "provider_breakdown": {
            "virustotal": {
                "status": "mock",
                "detected": is_mal,
                "score": seed,
                "details": {"mock": True, "note": "No VIRUSTOTAL_API_KEY configured"},
            },
            "abuseipdb": {
                "status": "mock" if indicator_type == "IP" else "not_applicable",
                "detected": is_mal if indicator_type == "IP" else False,
                "score": seed if indicator_type == "IP" else 0,
                "details": {"mock": True, "note": "No ABUSEIPDB_API_KEY configured"} if indicator_type == "IP" else None,
            },
            "alienvault": {
                "status": "mock",
                "detected": is_mal,
                "score": seed,
                "details": {"mock": True, "note": "No OTX_API_KEY configured"},
            },
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN LOOKUP ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════

async def lookup(indicator: str, indicator_type: str, db: Session) -> dict:
    """
    Main entry point. Checks 24h cache, dispatches concurrent provider queries
    if cache is stale or missing, aggregates results, and writes back to cache.
    """
    indicator_type = indicator_type.upper()

    # ── 1. Check cache ────────────────────────────────────────────────────────
    try:
        if db is not None:
            cached = db.query(models.ThreatIntelCache).filter(
                models.ThreatIntelCache.indicator == indicator
            ).first()

            if cached:
                age = datetime.now(timezone.utc) - cached.updated_at.replace(tzinfo=timezone.utc)
                if age < timedelta(hours=CACHE_TTL_HOURS):
                    logger.info("Cache HIT for %s (age: %s)", indicator, age)
                    return {
                        "indicator": cached.indicator,
                        "type": cached.indicator_type.value if hasattr(cached.indicator_type, 'value') else cached.indicator_type,
                        "is_malicious": cached.is_malicious,
                        "malicious_confidence_score": cached.overall_score,
                        "provider_breakdown": cached.raw_data or {},
                        "cached": True
                    }
    except Exception as e:
        logger.warning(f"Failed to read cache for {indicator}: {e}")

    logger.info("Cache MISS for %s — querying providers...", indicator)

    # ── 2. Check if all keys are missing → mock mode ──────────────────────────
    all_keys_missing = not VIRUSTOTAL_API_KEY and not ABUSEIPDB_API_KEY and not OTX_API_KEY
    if all_keys_missing or MOCK_MODE:
        logger.info("Mock mode: generating deterministic response for %s", indicator)
        mock_result = _generate_mock_result(indicator, indicator_type)
        _save_to_cache(db, indicator, indicator_type, mock_result)
        return mock_result

    # ── 3. Concurrent provider dispatch ───────────────────────────────────────
    results = await asyncio.gather(
        _query_virustotal(indicator, indicator_type),
        _query_abuseipdb(indicator, indicator_type),
        _query_alienvault(indicator, indicator_type),
        return_exceptions=True,
    )

    # ── 4. Aggregate ──────────────────────────────────────────────────────────
    provider_breakdown = {}
    successful_scores = []

    for res in results:
        if isinstance(res, Exception):
            logger.error("Provider raised exception: %s", res)
            continue
        provider_name = res.get("provider", "unknown")
        provider_breakdown[provider_name] = {
            "status": res.get("status"),
            "detected": res.get("detected", False),
            "score": res.get("score", 0),
            "details": res.get("details"),
        }
        if res.get("status") == "success":
            successful_scores.append(res.get("score", 0))

    overall_score = int(sum(successful_scores) / len(successful_scores)) if successful_scores else 0
    is_malicious = overall_score > 40 or any(
        p.get("detected") for p in provider_breakdown.values() if p.get("status") == "success"
    )

    unified = {
        "indicator": indicator,
        "type": indicator_type,
        "is_malicious": is_malicious,
        "malicious_confidence_score": overall_score,
        "provider_breakdown": provider_breakdown,
    }

    # ── 5. Write to cache ─────────────────────────────────────────────────────
    _save_to_cache(db, indicator, indicator_type, unified)

    return unified


def _save_to_cache(db: Session, indicator: str, indicator_type: str, result: dict):
    """Upsert the lookup result into the ThreatIntelCache table."""
    try:
        existing = db.query(models.ThreatIntelCache).filter(
            models.ThreatIntelCache.indicator == indicator
        ).first()

        if existing:
            existing.is_malicious = result.get("is_malicious", False)
            existing.overall_score = result.get("malicious_confidence_score", 0)
            existing.raw_data = result.get("provider_breakdown", {})
            existing.updated_at = datetime.now(timezone.utc)
        else:
            new_entry = models.ThreatIntelCache(
                indicator=indicator,
                indicator_type=indicator_type,
                is_malicious=result.get("is_malicious", False),
                overall_score=result.get("malicious_confidence_score", 0),
                raw_data=result.get("provider_breakdown", {}),
            )
            db.add(new_entry)

        db.commit()
        logger.info("Cache WRITE for %s", indicator)
    except Exception as e:
        logger.error("Failed to write cache for %s: %s", indicator, e)
        db.rollback()
