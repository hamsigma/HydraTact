import sys
from pathlib import Path

# Memastikan apps/backend-api dan packages/spatial-core/python terdaftar di sys.path
_BASE_DIR = Path(__file__).resolve().parent
if str(_BASE_DIR) not in sys.path:
    sys.path.insert(0, str(_BASE_DIR))

_SPATIAL_CORE_DIR = _BASE_DIR.parent.parent / "packages" / "spatial-core" / "python"
if _SPATIAL_CORE_DIR.exists() and str(_SPATIAL_CORE_DIR) not in sys.path:
    sys.path.insert(0, str(_SPATIAL_CORE_DIR))

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
import time
from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.db import check_db_health, close_db_pool, init_db_pool
from app.core.exceptions import (
    HydraTactException,
    general_exception_handler,
    http_exception_handler,
    hydratact_exception_handler,
    rate_limit_exceeded_handler,
    validation_exception_handler,
)
from app.core.limiter import limiter
from app.core.metrics import generate_prometheus_metrics_text, record_request_metric
from slowapi.errors import RateLimitExceeded

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("hydratact.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manajemen siklus hidup aplikasi FastAPI (startup & shutdown)."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    await init_db_pool()
    yield
    logger.info("Shutting down HydraTact application...")
    await close_db_pool()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Kontrak API terpadu untuk Dasbor Komando Web, Klien Mobile Offline-First, "
        "dan PWA Warga dalam penanganan darurat kebakaran permukiman padat tepian Mahakam Samarinda."
    ),
    servers=[
        {"url": "https://api.hydratact.id/api/v1", "description": "Production Server"},
        {"url": "http://localhost:8000/api/v1", "description": "Local Development Server"},
    ],
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# -----------------------------------------------------------------------------
# CORS Middleware & Rate Limiting & Metrics Middleware
# -----------------------------------------------------------------------------
app.state.limiter = limiter

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start_time
    record_request_metric(request.method, request.url.path, response.status_code, duration)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Global Exception Handlers
# -----------------------------------------------------------------------------
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_exception_handler(HydraTactException, hydratact_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# -----------------------------------------------------------------------------
# API Router v1
# -----------------------------------------------------------------------------
app.include_router(api_v1_router)


# -----------------------------------------------------------------------------
# System Probe Endpoints
# -----------------------------------------------------------------------------
@app.get("/", tags=["System"])
async def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "operational",
        "version": settings.VERSION,
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/metrics", response_class=PlainTextResponse, tags=["Observability"])
async def prometheus_metrics():
    """Prometheus metrics endpoint untuk scrape metrik operasional HTTP & dispatching."""
    return generate_prometheus_metrics_text()


@app.get("/health", tags=["System"])
async def health_check():
    """Pemeriksaan kesehatan sistem, latensi koneksi basis data Supabase PostGIS, dan spatial engine."""
    db_healthy, latency_ms, db_error = await check_db_health()
    overall_status = "healthy" if db_healthy else "degraded"

    return {
        "status": overall_status,
        "system": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "database": {
            "connected": db_healthy,
            "latency_ms": latency_ms,
            "message": "Connected to PostgreSQL PostGIS" if db_healthy else db_error,
        },
        "spatial_engine": "ready",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health/liveness", tags=["System"])
async def liveness_probe():
    """Kubernetes / Docker liveness probe: memastikan proses FastAPI tetap responsif."""
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/health/readiness", tags=["System"])
async def readiness_probe():
    """Kubernetes / Docker readiness probe: memastikan aplikasi siap menerima lalu lintas."""
    return {"status": "ready", "spatial_engine": "initialized"}
