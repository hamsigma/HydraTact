import logging
from datetime import datetime, timezone
from typing import Dict, List
from uuid import UUID, uuid4
from fastapi import APIRouter, Path, status

from app.core.db import get_db_pool
from app.schemas.barricade import (
    BarricadeCreateRequest,
    BarricadeData,
    BarricadeDeactivateData,
    BarricadeDeactivateResponse,
    BarricadeListResponse,
    BarricadeResponse,
)

logger = logging.getLogger("hydratact.barricades")
router = APIRouter(prefix="/barricades", tags=["Barikade Selang Jalan"])

# Fallback in-memory cache jika database lokal offline
_in_memory_barricades: Dict[str, Dict] = {
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01": {
        "barricade_id": UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01"),
        "road_name": "Mulut Jl. Pelita Gg. 4",
        "hose_length_meters": 110,
        "is_active": True,
        "created_at": datetime(2026, 11, 13, 20, 10, 0, tzinfo=timezone.utc),
    }
}


@router.get(
    "",
    response_model=BarricadeListResponse,
    status_code=status.HTTP_200_OK,
    summary="Daftar barikade jalan aktif",
    description="Mengambil seluruh barikade ruas jalan yang sedang aktif terpasang bentangan selang pemadam.",
)
async def list_barricades():
    """Mengambil daftar barikade ruas jalan aktif."""
    pool = get_db_pool()
    if pool is not None:
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT id, road_name, hose_length_meters, is_active, created_at
                    FROM road_barricades
                    WHERE is_active = TRUE
                    ORDER BY created_at DESC
                    """
                )
                items = [
                    BarricadeData(
                        barricade_id=row["id"],
                        road_name=row["road_name"],
                        hose_length_meters=row["hose_length_meters"],
                        is_active=row["is_active"],
                        created_at=row["created_at"],
                    )
                    for row in rows
                ]
                return BarricadeListResponse(status="success", data=items)
        except Exception as exc:
            logger.warning(f"Error querying active barricades from db: {exc}")

    # Fallback in-memory
    active_items = [
        BarricadeData(**data)
        for data in _in_memory_barricades.values()
        if data["is_active"]
    ]
    return BarricadeListResponse(status="success", data=active_items)


@router.post(
    "",
    response_model=BarricadeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tandai barikade bentangan selang pada ruas jalan",
    description="Menandai ruas jalan yang tertutup bentangan selang aktif (GeoJSON LineString) agar tidak dilindas atau dilalui kendaraan relawan lain.",
)
async def create_barricade(payload: BarricadeCreateRequest):
    """Mendaftarkan barikade penutupan ruas jalan akibat bentangan selang."""
    barricade_id = uuid4()
    now_utc = datetime.now(timezone.utc)
    pool = get_db_pool()

    if pool is not None:
        try:
            async with pool.acquire() as conn:
                coords = payload.geometry.coordinates
                line_wkt = f"LINESTRING({', '.join(f'{c[0]} {c[1]}' for c in coords)})"
                sql = """
                    INSERT INTO road_barricades (id, incident_id, road_name, path_geom, reason, hose_length_meters, is_active, created_at)
                    VALUES ($1, $2, $3, ST_GeomFromText($4, 4326)::geography, $5::barricade_reason_type, $6, TRUE, $7)
                    RETURNING id, road_name, hose_length_meters, is_active, created_at;
                """
                row = await conn.fetchrow(
                    sql,
                    barricade_id,
                    payload.incident_id,
                    payload.road_name,
                    line_wkt,
                    payload.reason.value if hasattr(payload.reason, "value") else str(payload.reason),
                    payload.hose_length_meters,
                    now_utc,
                )
                data = BarricadeData(
                    barricade_id=row["id"],
                    road_name=row["road_name"],
                    hose_length_meters=row["hose_length_meters"],
                    is_active=row["is_active"],
                    created_at=row["created_at"],
                )
                return BarricadeResponse(status="success", data=data)
        except Exception as exc:
            logger.warning(f"Error creating barricade in db: {exc}")

    # Fallback in-memory
    data = BarricadeData(
        barricade_id=barricade_id,
        road_name=payload.road_name,
        hose_length_meters=payload.hose_length_meters,
        is_active=True,
        created_at=now_utc,
    )
    _in_memory_barricades[str(barricade_id)] = data.model_dump()
    return BarricadeResponse(status="success", data=data)


@router.patch(
    "/{barricade_id}/deactivate",
    response_model=BarricadeDeactivateResponse,
    status_code=status.HTTP_200_OK,
    summary="Buka kembali akses jalan yang dibarikade",
    description="Menonaktifkan tanda barikade pada peta taktis setelah selang digulung atau operasi pemadaman selesai.",
)
async def deactivate_barricade(
    barricade_id: UUID = Path(..., description="UUID unik barikade jalan"),
):
    """Menonaktifkan barikade selang jalan (membuka kembali akses jalan)."""
    now_utc = datetime.now(timezone.utc)
    pool = get_db_pool()

    if pool is not None:
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    "UPDATE road_barricades SET is_active = FALSE, deactivated_at = $1 WHERE id = $2",
                    now_utc,
                    barricade_id,
                )
                return BarricadeDeactivateResponse(
                    status="success",
                    data=BarricadeDeactivateData(
                        barricade_id=barricade_id,
                        is_active=False,
                        deactivated_at=now_utc,
                    ),
                )
        except Exception as exc:
            logger.warning(f"Error deactivating barricade in db: {exc}")

    # Fallback in-memory
    if str(barricade_id) in _in_memory_barricades:
        _in_memory_barricades[str(barricade_id)]["is_active"] = False

    return BarricadeDeactivateResponse(
        status="success",
        data=BarricadeDeactivateData(
            barricade_id=barricade_id,
            is_active=False,
            deactivated_at=now_utc,
        ),
    )
