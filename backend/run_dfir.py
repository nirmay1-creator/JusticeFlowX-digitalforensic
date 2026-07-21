import uvicorn

if __name__ == "__main__":
    print("==================================================")
    print("  JusticeFlowX DFIR Engine (FastAPI)")
    print("  Running on http://localhost:5003")
    print("==================================================")
    uvicorn.run("dfir_engine.main:app", host="0.0.0.0", port=5003, reload=True)
