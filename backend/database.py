import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv() # Load variables from .env if present

# Fetch database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("WARNING: DATABASE_URL environment variable is missing. Running without a database connection.")
    engine = None
    SessionLocal = None
else:
    try:
        connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
        engine = create_engine(DATABASE_URL, connect_args=connect_args)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        print(f"Failed to configure database engine: {e}")
        engine = None
        SessionLocal = None

Base = declarative_base()

def get_db():
    if not SessionLocal:
        raise Exception("Database not configured. Please check your DATABASE_URL in .env.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
