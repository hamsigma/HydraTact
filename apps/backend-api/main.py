from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="HydraTact Samarinda - Tactical Core API",
    version="1.0.0",
    description="Backend API spasial dan orkestrasi taktis pemadaman kebakaran permukiman padat",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "system": "HydraTact Samarinda",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "supabase_connected",
        "spatial_engine": "ready"
    }
