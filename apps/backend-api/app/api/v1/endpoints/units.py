import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict
from uuid import UUID, uuid4
from fastapi import APIRouter, Path, status

from app.core.db import get_db_pool
from app.schemas.unit import (
    PressureRequest,
    PressureRequestData,
    PressureRequestResponse,
    UnitTelemetryUpdateRequest,
)

logger = logging.getLogger("hydratact.units")
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
    """Merekam dan menyiarkan sinyal permintaan tekanan pompa air antar unit."""
    request_id = uuid4()
    now_utc = datetime.now(timezone.utc)
    pool = get_db_pool()

    if pool is not None:
        try:
            async with pool.acquire() as conn:
                mutation_payload = {
                    "request_id": str(request_id),
                    "from_unit_id": str(unit_id),
                    "to_unit_id": str(payload.to_unit_id),
                    "target_bar": payload.target_bar,
                    "notes": payload.notes,
                }
                sql = """
                    INSERT INTO telemetry_mutation_logs (
                        mutation_uuid, device_id, action_type, payload, client_timestamp, server_received_at
                    ) VALUES ($1, $2, $3, $4::jsonb, $5, NOW())
                    ON CONFLICT (mutation_uuid) DO NOTHING;
                """
                await conn.execute(
                    sql,
                    request_id,
                    f"unit-{str(unit_id)[:8]}",
                    "REQUEST_WATER_PRESSURE",
                    json.dumps(mutation_payload),
                    now_utc,
                )
        except Exception as exc:
            logger.warning(f"Error logging pressure request in db: {exc}")

    data = PressureRequestData(
        request_id=request_id,
        from_unit_id=unit_id,
        to_unit_id=payload.to_unit_id,
        target_bar=payload.target_bar,
        requested_at=now_utc,
    )
    return PressureRequestResponse(status="success", data=data)


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
    """Memperbarui telemetri GPS dan status sisa air pompa unit armada."""
    now_utc = datetime.now(timezone.utc)
    pool = get_db_pool()

    if pool is not None:
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE incident_units
                    SET current_geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                        last_ping_at = $3
                    WHERE id = $4
                    """,
                    payload.coordinates.coordinates[0],
                    payload.coordinates.coordinates[1],
                    now_utc,
                    unit_id,
                )
        except Exception as exc:
            logger.warning(f"Error updating unit telemetry in db: {exc}")

    return {
        "status": "success",
        "unit_id": str(unit_id),
        "pump_active": payload.pump_active,
        "water_remaining_liters": payload.water_remaining_liters,
        "updated_at": now_utc.isoformat(),
    }
