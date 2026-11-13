from typing import Any, Dict
from uuid import UUID
from fastapi import APIRouter, Path, status

from app.schemas.unit import (
    PressureRequest,
    PressureRequestResponse,
    UnitTelemetryUpdateRequest,
)

router = APIRouter(prefix="/units", tags=["Koordinasi Armada & Tekanan Air"])


@router.post(
    "/{unit_id}/pressure-request",
    response_model=PressureRequestResponse,
    status_code=status.HTTP_200_OK,
    summary="Kirim sinyal permintaan tekanan pompa air antar armada",
    description="Mengirim sinyal permintaan tekanan pompa air (misal 5.0 Bar) dari unit ATTACKER ke unit FEEDER terhubung.",
)
async def request_water_pressure(
    payload: PressureRequest,
    unit_id: UUID = Path(..., description="UUID unit peminta (Attacker)"),
):
    """Placeholder implementasi kontrak endpoint permintaan tekanan pompa."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")


@router.post(
    "/{unit_id}/telemetry",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Pembaruan telemetri GPS dan status pompa unit",
    description="Menerima lokasi GPS berkala dan status pompa pemadam unit lapangan untuk disiarkan ke dasbor komando.",
)
async def update_unit_telemetry(
    payload: UnitTelemetryUpdateRequest,
    unit_id: UUID = Path(..., description="UUID unit pelapor"),
):
    """Placeholder implementasi kontrak endpoint telemetri unit."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")
