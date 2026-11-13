import logging
from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.common import ErrorDetail, ErrorResponse

logger = logging.getLogger("hydratact.exceptions")


class HydraTactException(Exception):
    """Kelas dasar seluruh eksepsi domain aplikasi HydraTact."""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}


class SpatialValidationException(HydraTactException):
    """Koordinat spasial di luar batas Kota Samarinda atau format WGS 84 salah."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="INVALID_GEOJSON_COORDINATES",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class EntityNotFoundException(HydraTactException):
    """Entitas (Insiden, Unit, Sumber Air, Barikade) tidak ditemukan."""

    def __init__(self, entity_name: str, entity_id: Any):
        super().__init__(
            message=f"{entity_name} dengan ID '{entity_id}' tidak ditemukan dalam sistem.",
            error_code=f"{entity_name.upper()}_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"entity": entity_name, "id": str(entity_id)},
        )


class InvalidFSMTransitionException(HydraTactException):
    """Percobaan melompati tahapan FSM insiden yang tidak diizinkan."""

    def __init__(
        self,
        current_status: str,
        target_status: str,
        allowed_statuses: Optional[list] = None,
    ):
        super().__init__(
            message=(
                f"Transisi status FSM dari '{current_status}' langsung ke "
                f"'{target_status}' tidak diizinkan oleh protokol taktis."
            ),
            error_code="INVALID_FSM_TRANSITION",
            status_code=status.HTTP_409_CONFLICT,
            details={
                "current_status": current_status,
                "target_status": target_status,
                "allowed_next_statuses": allowed_statuses or [],
            },
        )


class HapticHoldTooShortException(HydraTactException):
    """Durasi sentuh tombol darurat warga kurang dari ambang batas 2000ms."""

    def __init__(self, duration_ms: int):
        super().__init__(
            message=f"Durasi sentuh tahan tombol darurat ({duration_ms}ms) kurang dari batas minimum 2000ms.",
            error_code="HAPTIC_HOLD_TOO_SHORT",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"required_min_ms": 2000, "actual_ms": duration_ms},
        )


class UnauthorizedOperationException(HydraTactException):
    """Hak akses peran tidak mencukupi untuk mengeksekusi operasi."""

    def __init__(self, required_role: str, actual_role: str):
        super().__init__(
            message=f"Operasi memerlukan peran '{required_role}', peran Anda saat ini: '{actual_role}'.",
            error_code="INSUFFICIENT_ROLE_PERMISSION",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"required_role": required_role, "actual_role": actual_role},
        )


class RateLimitExceededException(HydraTactException):
    """Frekuensi permintaan melebihi kuota pelaporan darurat."""

    def __init__(self, message: str = "Batas frekuensi pelaporan darurat terlampaui. Coba lagi beberapa saat."):
        super().__init__(
            message=message,
            error_code="REPORT_RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )


# =============================================================================
# Global Exception Handlers
# =============================================================================

async def hydratact_exception_handler(request: Request, exc: HydraTactException) -> JSONResponse:
    """Handler untuk seluruh eksepsi terstruktur domain HydraTact."""
    response_payload = ErrorResponse(
        status="error",
        error=ErrorDetail(
            code=exc.error_code,
            message=exc.message,
            details=exc.details if exc.details else None,
        ),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=response_payload.model_dump(),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handler terpusat untuk error validasi skema Pydantic (422)."""
    errors_summary = []
    for err in exc.errors():
        field_path = " -> ".join(str(loc) for loc in err.get("loc", []))
        errors_summary.append({
            "field": field_path,
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error"),
        })

    response_payload = ErrorResponse(
        status="error",
        error=ErrorDetail(
            code="VALIDATION_ERROR",
            message="Data permintaan tidak memenuhi spesifikasi skema kontrak API.",
            details={"validation_errors": errors_summary},
        ),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_payload.model_dump(),
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handler terpusat untuk HTTP exception standar Starlette/FastAPI."""
    response_payload = ErrorResponse(
        status="error",
        error=ErrorDetail(
            code=f"HTTP_{exc.status_code}",
            message=str(exc.detail),
            details=None,
        ),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=response_payload.model_dump(),
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler tangkapan akhir untuk error sistem yang tidak tertangani (500)."""
    logger.exception(f"Unhandled system error: {exc}")
    response_payload = ErrorResponse(
        status="error",
        error=ErrorDetail(
            code="INTERNAL_SERVER_ERROR",
            message="Terjadi kesalahan tak terduga pada peladen HydraTact.",
            details={"exception_type": type(exc).__name__},
        ),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response_payload.model_dump(),
    )
