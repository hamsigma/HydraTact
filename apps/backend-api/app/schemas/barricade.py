from datetime import datetime
from typing import List, Literal
from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.common import BarricadeReason, GeoLineString


class BarricadeCreateRequest(BaseModel):
    """Permintaan penandaan barikade selang pada ruas jalan yang ditutup."""
    incident_id: UUID = Field(..., description="UUID insiden terkait")
    road_name: str = Field(..., description="Nama ruas jalan atau gang yang terhalang bentangan selang", examples=["Mulut Jl. Pelita Gg. 4"])
    reason: BarricadeReason = Field(
        default=BarricadeReason.HOSE_CONNECTED,
        description="Alasan penutupan ruas jalan",
    )
    hose_length_meters: int = Field(..., ge=1, description="Panjang bentangan selang dalam meter", examples=[110])
    geometry: GeoLineString = Field(..., description="Geometri garis koordinat bentangan selang pada jalan")


class BarricadeData(BaseModel):
    """Informasi status barikade jalan terdaftar."""
    barricade_id: UUID = Field(..., description="UUID unik barikade jalan")
    road_name: str = Field(..., description="Nama ruas jalan")
    hose_length_meters: int = Field(..., description="Panjang selang terpasang")
    is_active: bool = Field(..., description="Status aktif barikade (menghalangi kendaraan lain)")
    created_at: datetime = Field(..., description="Waktu pemasangan barikade")


class BarricadeResponse(BaseModel):
    """Respons registrasi barikade bentangan selang."""
    status: Literal["success"] = "success"
    data: BarricadeData


class BarricadeDeactivateData(BaseModel):
    """Data hasil pembukaan kembali barikade selang jalan."""
    barricade_id: UUID = Field(..., description="UUID barikade yang dinonaktifkan")
    is_active: bool = Field(False, description="Status keaktifan barikade (false = jalan dibuka)")
    deactivated_at: datetime = Field(..., description="Waktu pembongkaran barikade")


class BarricadeDeactivateResponse(BaseModel):
    """Respons pembukaan kembali akses jalan."""
    status: Literal["success"] = "success"
    data: BarricadeDeactivateData


class BarricadeListResponse(BaseModel):
    """Respons daftar seluruh barikade aktif."""
    status: Literal["success"] = "success"
    data: List[BarricadeData]

