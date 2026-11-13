from datetime import datetime
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.common import GeoPoint, TacticalRole, VehicleType


class UnitAssignRequest(BaseModel):
    """Permintaan alokasi armada ke suatu insiden kebakaran."""
    unit_identifier: str = Field(..., description="Kode panggil armada", examples=["FDR-02"])
    posko_name: str = Field(..., description="Nama posko relawan induk", examples=["Balakarcana Posko 02"])
    vehicle_type: VehicleType = Field(..., description="Tipe fisik kendaraan")
    water_capacity_liters: int = Field(..., ge=0, description="Kapasitas tampung tangki air unit dalam liter", examples=[5000])
    current_location: GeoPoint = Field(..., description="Posisi GPS terkini unit saat mendaftar")


class UnitAssignData(BaseModel):
    """Hasil penugasan peran taktis otomatis (Dynamic Role Dispatching)."""
    unit_id: UUID = Field(..., description="UUID penugasan unit")
    unit_identifier: str = Field(..., description="Kode panggil armada")
    assigned_role: TacticalRole = Field(..., description="Peran taktis yang ditetapkan (ATTACKER atau FEEDER)")
    dispatch_rationale: str = Field(..., description="Dasar evaluasi matematis lebar gang vs kapasitas tangki")
    tactical_instruction: str = Field(..., description="Instruksi taktis operasional langsung untuk pengemudi/komandan unit")
    paired_unit: Optional[str] = Field(None, description="Kode panggil armada pasangan relai (Attacker <-> Feeder)")


class UnitAssignResponse(BaseModel):
    """Respons terstandarisasi registrasi peran armada."""
    status: Literal["success"] = "success"
    data: UnitAssignData


class PressureRequest(BaseModel):
    """Sinyal permintaan tekanan pompa air dari unit penyerang (Attacker) ke unit pemasok (Feeder)."""
    target_bar: float = Field(5.0, ge=1.0, le=25.0, description="Target tekanan suplai dalam satuan Bar", examples=[5.0])
    to_unit_id: UUID = Field(..., description="UUID unit feeder yang memasok air")
    notes: Optional[str] = Field(None, description="Catatan operasional kondisi nozzle/selang")


class PressureRequestData(BaseModel):
    """Data konfirmasi pengiriman sinyal tekanan pompa."""
    request_id: UUID = Field(..., description="UUID log permintaan tekanan")
    from_unit_id: UUID = Field(..., description="UUID unit penyerang")
    to_unit_id: UUID = Field(..., description="UUID unit pemasok")
    target_bar: float = Field(..., description="Tekanan yang diminta")
    requested_at: datetime = Field(..., description="Stempel waktu pengiriman sinyal")


class PressureRequestResponse(BaseModel):
    """Respons pengiriman sinyal permintaan tekanan pompa."""
    status: Literal["success"] = "success"
    data: PressureRequestData


class UnitTelemetryUpdateRequest(BaseModel):
    """Pembaruan berkala posisi telemetri GPS dan status pompa unit."""
    coordinates: GeoPoint = Field(..., description="Posisi GPS terkini unit")
    fire_distance_meters: Optional[float] = Field(None, description="Jarak estimasi ke episentrum api")
    pump_active: bool = Field(False, description="Status aktif pompa pemadam")
    water_remaining_liters: Optional[int] = Field(None, ge=0, description="Estimasi sisa air tangki")
