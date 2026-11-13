from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.common import GeoPoint, WaterSourceStatus, WaterSourceType


class WaterSourceItem(BaseModel):
    """Informasi titik pasokan air terdekat."""
    source_id: UUID = Field(..., description="UUID unik sumber air")
    code: str = Field(..., description="Kode identitas hidran/tandon", examples=["HYD-PLT-04"])
    name: str = Field(..., description="Nama lokasi sumber air", examples=["Hidran PDAM Jl. Pelita"])
    source_type: WaterSourceType = Field(..., description="Tipe fisik sumber air")
    status: WaterSourceStatus = Field(..., description="Status kesiapan pasokan air terkini")
    pressure_bar: Optional[float] = Field(None, description="Tekanan air tercatat dalam bar")
    capacity_liters: Optional[int] = Field(None, description="Estimasi volume tampungan air jika berbentuk tandon")
    distance_meters: float = Field(..., description="Jarak spasial langsung dari posisi armada dalam meter")
    estimated_travel_minutes: float = Field(..., description="Estimasi waktu tempuh armada ke sumber air")
    location: GeoPoint = Field(..., description="Koordinat lokasi WGS 84 [lng, lat]")
    last_verified_at: Optional[datetime] = Field(None, description="Stempel waktu terakhir diverifikasi oleh relawan")


class NearestWaterResponse(BaseModel):
    """Respons pencarian daftar sumber air terdekat."""
    status: Literal["success"] = "success"
    data: List[WaterSourceItem]


class WaterStatusUpdateRequest(BaseModel):
    """Pembaruan cepat 1-tap kondisi sumber air di lapangan."""
    status: WaterSourceStatus = Field(..., description="Status baru kondisi sumber air")
    pressure_bar: Optional[float] = Field(None, ge=0.0, le=25.0, description="Pengukuran tekanan aktual oleh relawan (bar)")
    reported_by_unit: Optional[str] = Field(None, description="Kode panggil armada pelapor", examples=["FDR-02"])
    notes: Optional[str] = Field(None, description="Catatan kondisi fisik hidran/tandon")


class WaterStatusUpdateData(BaseModel):
    """Data hasil pembaruan status sumber air."""
    source_id: UUID = Field(..., description="UUID sumber air yang diperbarui")
    code: str = Field(..., description="Kode identitas sumber air")
    status: WaterSourceStatus = Field(..., description="Status kesiapan terbaru")
    pressure_bar: Optional[float] = Field(None, description="Tekanan yang tercatat")
    effective_timestamp: datetime = Field(..., description="Stempel waktu efektif pembaruan")


class WaterStatusUpdateResponse(BaseModel):
    """Respons terstandarisasi pembaruan status sumber air."""
    status: Literal["success"] = "success"
    data: WaterStatusUpdateData
