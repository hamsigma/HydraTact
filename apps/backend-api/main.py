from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router

app = FastAPI(
    title="HydraTact Samarinda Tactical Coordination API",
    version="1.0.0",
    description="Kontrak API terpadu untuk Dasbor Komando Web, Klien Mobile Offline-First, dan PWA Warga dalam penanganan darurat kebakaran permukiman padat tepian Mahakam Samarinda.",
    servers=[
        {"url": "https://api.hydratact.id/api/v1", "description": "Production Server"},
        {"url": "http://localhost:8000/api/v1", "description": "Local Development Server"},
    ],
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)


@app.get("/", tags=["System"])
async def root():
    return {
        "system": "HydraTact Samarinda",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "database": "supabase_connected",
        "spatial_engine": "ready",
    }
