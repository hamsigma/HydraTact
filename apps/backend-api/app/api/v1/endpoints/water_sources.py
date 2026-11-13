from uuid import UUID
from fastapi import APIRouter, Path, Query, status

from app.core.db import get_db_pool
from app.repositories.spatial import (
    query_nearest_water_sources,
    update_water_source_status_in_db,
)
from app.schemas.water import (
    NearestWaterResponse,
    WaterStatusUpdateRequest,
    WaterStatusUpdateResponse,
)

router = APIRouter(prefix="/water-sources", tags=["Logistik & Pasokan Air"])


@router.get(
    "/nearest",
    response_model=NearestWaterResponse,
    status_code=status.HTTP_200_OK,
    summary="Cari sumber air aktif terdekat menggunakan indeks PostGIS GIST",
    description="Mengambil N sumber air aktif terdekat (hidran PDAM, tandon warga, posko dermaga sungai) menggunakan perhitungan spasial ST_DWithin dan ST_Distance.",
)
async def get_nearest_water_sources(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Koordinat lintang posisi armada saat ini", examples=[-0.4945]),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Koordinat bujur posisi armada saat ini", examples=[117.1438]),
    limit: int = Query(3, ge=1, le=20, description="Jumlah maksimal rekomendasi sumber air yang ditampilkan"),
    include_low_discharge: bool = Query(True, description="Sertakan hidran berdebit rendah (LOW_DISCHARGE)"),
):
    """Pencarian sumber air aktif terdekat berbasis indeks spasial PostGIS GIST."""
    pool = get_db_pool()
    connection = None
    if pool is not None:
        async with pool.acquire() as conn:
            items = await query_nearest_water_sources(
                connection=conn,
                lat=lat,
                lng=lng,
                limit=limit,
                include_low_discharge=include_low_discharge,
            )
            return NearestWaterResponse(status="success", data=items)

    # Fallback saat pool belum aktif
    items = await query_nearest_water_sources(
        connection=None,
        lat=lat,
        lng=lng,
        limit=limit,
        include_low_discharge=include_low_discharge,
    )
    return NearestWaterResponse(status="success", data=items)


@router.patch(
    "/{source_id}/status",
    response_model=WaterStatusUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Pembaruan 1-ketukan status kondisi sumber air",
    description="Memperbarui status kondisi sumber air di lapangan (READY, LOW_DISCHARGE, EMPTY, DAMAGED) oleh relawan.",
)
async def update_water_source_status(
    payload: WaterStatusUpdateRequest,
    source_id: UUID = Path(..., description="UUID unik sumber air"),
):
    """Pembaruan status kesiapan sumber air di lapangan."""
    pool = get_db_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            data = await update_water_source_status_in_db(conn, source_id, payload)
            return WaterStatusUpdateResponse(status="success", data=data)

    data = await update_water_source_status_in_db(None, source_id, payload)
    return WaterStatusUpdateResponse(status="success", data=data)

