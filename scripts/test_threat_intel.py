# pyrefly: ignore [missing-import]
import pytest
import asyncio
from unittest.mock import MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
# pyrefly: ignore [missing-import]
import httpx

# Import the backend modules (assuming this is run from the backend directory or PYTHONPATH is set)
# Adjust imports based on the actual path structure when running
from backend import models
from backend.services.threat_intel import check_ip_reputation

# --- DB SETUP FOR TESTS ---
# Use an in-memory SQLite database for fast unit testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Provides an isolated database session per test."""
    models.Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    models.Base.metadata.drop_all(bind=engine)


# --- MOCK HELPERS ---
def create_mock_response(status_code: int, json_data: dict):
    """Creates a fake httpx.Response object."""
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = status_code
    mock_resp.json.return_value = json_data
    
    if status_code >= 400:
        mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            message=f"Error {status_code}",
            request=MagicMock(),
            response=mock_resp
        )
    return mock_resp


# --- TESTS ---

@pytest.mark.asyncio
async def test_malicious_ip_flagged(db_session, mocker):
    """TEST 1 & 2: Mock a malicious response and verify it returns is_malicious=True."""
    mock_ip = "198.51.100.1" # Standard test IP
    
    # Mock httpx.AsyncClient.get to return a 90% abuse score
    mock_get = mocker.patch("httpx.AsyncClient.get")
    mock_get.return_value = create_mock_response(200, {
        "data": {"abuseConfidenceScore": 90}
    })

    # Execute the service
    result = await check_ip_reputation(mock_ip, db_session)
    
    assert mock_get.call_count == 1
    assert result["ip"] == mock_ip
    assert result["score"] == 90
    assert result["is_malicious"] is True
    
    # Verify it was saved to the DB cache
    cached_ip = db_session.query(models.IPReputationCache).filter_by(ip_address=mock_ip).first()
    assert cached_ip is not None
    assert cached_ip.is_malicious is True


@pytest.mark.asyncio
async def test_clean_ip_flagged(db_session, mocker):
    """TEST 1: Mock a clean response and verify it returns is_malicious=False."""
    mock_ip = "198.51.100.2"
    
    # Mock a clean score (0%)
    mock_get = mocker.patch("httpx.AsyncClient.get")
    mock_get.return_value = create_mock_response(200, {
        "data": {"abuseConfidenceScore": 0}
    })

    result = await check_ip_reputation(mock_ip, db_session)
    assert result["is_malicious"] is False


@pytest.mark.asyncio
async def test_cache_mechanism_works(db_session, mocker):
    """TEST 3: Verify the external API is only called once for the same IP."""
    mock_ip = "198.51.100.3"
    
    mock_get = mocker.patch("httpx.AsyncClient.get")
    mock_get.return_value = create_mock_response(200, {
        "data": {"abuseConfidenceScore": 100}
    })

    # Call it the first time (Cache Miss -> API called)
    res1 = await check_ip_reputation(mock_ip, db_session)
    assert mock_get.call_count == 1
    
    # Call it the second time (Cache Hit -> API bypassed)
    res2 = await check_ip_reputation(mock_ip, db_session)
    
    # The API should NOT have been called a second time
    assert mock_get.call_count == 1
    
    # Both results should match
    assert res1["is_malicious"] == res2["is_malicious"] == True


@pytest.mark.asyncio
async def test_graceful_handling_of_rate_limits(db_session, mocker):
    """TEST 4: Verify an external HTTP 429 (Rate Limit) error fails gracefully."""
    mock_ip = "198.51.100.4"
    
    mock_get = mocker.patch("httpx.AsyncClient.get")
    # Simulate a rate limit error
    mock_get.return_value = create_mock_response(429, {"error": "Rate limit exceeded"})

    # The function should catch the httpx.HTTPStatusError internally 
    # and return a safe default instead of crashing the worker.
    result = await check_ip_reputation(mock_ip, db_session)
    
    assert mock_get.call_count == 1
    assert result["score"] == 0
    assert result["is_malicious"] is False
