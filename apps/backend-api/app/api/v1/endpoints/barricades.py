from uuid import UUID
from fastapi import APIRouter, Path, status

from app.schemas.barricade import (
    BarricadeCreateRequest,
    BarricadeDeactivateResponse,
    BarricadeResponse,
)

router = APIRouter(prefix="/barricades", tags=["Barikade Selang Jalan"])


@router.post(
    "",
    response_model=BarricadeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tandai barikade bentangan selang pada ruas jalan",
    description="Menandai ruas jalan yang tertutup bentangan selang aktif (GeoJSON LineString) agar tidak dilindas atau dilalui kendaraan relawan lain.",
)
async def create_barricade(payload: BarricadeCreateRequest):
    """Placeholder implementasi kontrak endpoint pembuatan barikade."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")


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
    """Placeholder implementasi kontrak endpoint penonaktifan barikade."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")
