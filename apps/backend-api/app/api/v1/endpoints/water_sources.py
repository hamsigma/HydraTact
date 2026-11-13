from uuid import UUID
from fastapi import APIRouter, Path, Query, status

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
    """Placeholder implementasi kontrak endpoint pencarian sumber air."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")


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
    """Placeholder implementasi kontrak endpoint pembaruan status sumber air."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")
