from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db

from .api.upload import router as upload_router
from .api.analysis import router as analysis_router
from .api.reports import router as reports_router

app = FastAPI(
    title="JusticeFlowX DFIR Engine",
    description="Real Malware Analysis Pipeline",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()
    print("DFIR Engine DB Initialized.")

# Include routers
app.include_router(upload_router)
app.include_router(analysis_router)
app.include_router(reports_router)

@app.get("/")
def read_root():
    return {"status": "JusticeFlowX DFIR Engine is running"}
