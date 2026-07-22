import logging
import os
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from dotenv import load_dotenv

load_dotenv()

# Local imports
from database import engine, get_db
import models
from routers import auth, cases

from contextlib import asynccontextmanager

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for safe database initialization on startup."""
    try:
        if engine:
            models.Base.metadata.create_all(bind=engine)
            logger.info("Database tables created/verified successfully on startup.")
        else:
            logger.warning("Database engine is not configured!")
    except Exception as e:
        logger.error(f"Failed to initialize database tables during startup: {e}")
    
    yield
    
    # Optional shutdown logic can go here

limiter = Limiter(key_func=get_remote_address, default_limits=["200/day", "50/hour"])
app = FastAPI(title="JusticeFlowX API", version="3.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS Middleware (Allow requests from Nginx frontend)
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth, cases, law, threat_intel, system, threat_hunter, justicegpt

# Include Routers
app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(law.router)
app.include_router(threat_intel.router)
app.include_router(system.router, prefix="/api/system", tags=["System"])
app.include_router(threat_hunter.router)
app.include_router(justicegpt.router)

# --- GLOBAL ROUTES ---

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify API and DB status."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected ({str(e)})"

    return {
        "status": "online",
        "service": "JusticeFlowX Backend",
        "database": db_status
    }
