import logging
import time
from typing import AsyncGenerator, Optional, Tuple
import asyncpg

from app.core.config import settings

logger = logging.getLogger("hydratact.db")

_pool: Optional[asyncpg.Pool] = None
_pool_init_attempted: bool = False


async def init_db_pool(force: bool = False) -> Optional[asyncpg.Pool]:
    """Inisialisasi pool koneksi asinkron asyncpg ke basis data PostgreSQL PostGIS."""
    global _pool, _pool_init_attempted
    if _pool is not None:
        return _pool
    if _pool_init_attempted and not force:
        return None

    _pool_init_attempted = True
    try:
        logger.info(f"Connecting to database pool at {settings.DATABASE_URL}...")
        _pool = await asyncpg.create_pool(
            dsn=settings.DATABASE_URL,
            min_size=settings.DB_POOL_MIN_SIZE,
            max_size=settings.DB_POOL_MAX_SIZE,
            timeout=settings.DB_POOL_TIMEOUT_SECONDS,
            command_timeout=settings.DB_POOL_TIMEOUT_SECONDS,
        )
        logger.info("Database connection pool initialized successfully.")
        return _pool
    except Exception as exc:
        logger.warning(
            f"Failed to connect to PostgreSQL database ({exc}). "
            "Server will continue in degraded mode until database is available."
        )
        _pool = None
        return None


async def close_db_pool() -> None:
    """Menutup seluruh koneksi dalam pool secara aman (graceful shutdown)."""
    global _pool
    if _pool is not None:
        logger.info("Closing database connection pool...")
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed.")


def get_db_pool() -> Optional[asyncpg.Pool]:
    """Mengembalikan instance connection pool aktif."""
    return _pool


async def get_db_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """Dependency FastAPI untuk memperoleh koneksi aktif dari pool."""
    global _pool
    if _pool is None:
        # Coba inisialisasi ulang jika sebelumnya belum tersambung
        await init_db_pool()

    if _pool is None:
        raise RuntimeError("Database connection pool is not available.")

    async with _pool.acquire() as connection:
        yield connection


async def check_db_health() -> Tuple[bool, Optional[float], Optional[str]]:
    """Pemeriksaan kesehatan koneksi database dan pengukuran latensi round-trip (ms)."""
    global _pool
    if _pool is None:
        return False, None, "Connection pool is not initialized"

    start_time = time.perf_counter()
    try:
        async with _pool.acquire() as connection:
            result = await connection.fetchval("SELECT 1")
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            if result == 1:
                return True, round(latency_ms, 2), None
            return False, round(latency_ms, 2), "Unexpected query result"
    except Exception as exc:
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return False, round(latency_ms, 2), str(exc)
