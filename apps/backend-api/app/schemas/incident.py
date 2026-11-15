from datetime import datetime
from typing import Any, List, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

from app.schemas.common import (
    GeoPoint,
    IncidentFSMStatus,
    TacticalRole,
    VehicleType,
)


class CitizenReportRequest(BaseModel):
    """Permintaan pelaporan darurat kebakaran oleh warga (1-tap SOS)."""
    reporter_phone: str = Field(
        ...,
        pattern=r"^\+?[0-9]{9,15}$",
        description="Nomor kontak WhatsApp/telepon pelapor",
        examples=["+6281343408542"],
    )
    location: GeoPoint = Field(..., description="Koordinat lokasi kebakaran WGS 84 [lng, lat]")
    gps_accuracy_meters: float = Field(
        default=5.0,
        ge=0.0,
        le=5000.0,
        description="Akurasi radius GPS dalam meter (toleransi hingga 5000m untuk perangkat desktop/WiFi)",
        examples=[4.2],
    )
    haptic_hold_duration_ms: int = Field(
        default=2000,
        ge=1800,
        description="Durasi sentuh tahan tombol SOS dalam milidetik (minimal 1800ms-2000ms untuk eliminasi panggilan palsu)",
        examples=[2050],
    )
    client_timestamp: datetime = Field(
        ...,
        description="Stempel waktu saat penekanan tombol di perangkat klien (ISO-8601)",
    )


# Alias untuk backward compatibility
IncidentReportRequest = CitizenReportRequest


class ConsensusData(BaseModel):
    """Status evaluasi konsensus spasial klaster pelaporan."""
    is_verified: bool = Field(..., description="Status verifikasi otomatis tercapai (>=2 pelapor independen)")
    unique_reporters_count: int = Field(..., description="Jumlah pelapor unik dalam klaster")
    cluster_radius_meters: float = Field(100.0, description="Ambang batas radius klaster konsensus dalam meter")


class RespondingUnitSummary(BaseModel):
    """Ringkasan unit pemadam terdekat yang merespons."""
    unit_identifier: str = Field(..., description="Kode panggil armada", examples=["ATK-04"])
    eta_minutes: float = Field(..., description="Estimasi waktu tiba dalam menit", examples=[3.0])


class IncidentReportData(BaseModel):
    """Data payload hasil pelaporan kebakaran darurat."""
    incident_id: UUID = Field(..., description="UUID unik insiden")
    incident_code: str = Field(..., description="Kode registrasi taktis insiden", examples=["HT-2026-089"])
    incident_status: IncidentFSMStatus = Field(..., description="Status terkini siklus insiden")
    consensus: ConsensusData = Field(..., description="Metrik konsensus spasial")
    resolved_address: Optional[str] = Field(None, description="Alamat terkonversi dari geolokasi")
    detected_road_width_meters: Optional[float] = Field(None, description="Lebar ruas jalan/gang terdeteksi dari peta OSM")
    nearest_responding_unit: Optional[RespondingUnitSummary] = Field(None, description="Armada terdekat pertama")


class IncidentReportResponse(BaseModel):
    """Respons terstandarisasi pengiriman laporan insiden."""
    status: Literal["success"] = "success"
    data: IncidentReportData


class FSMTransitionRequest(BaseModel):
    """Permintaan transisi tahapan penanganan kebakaran pada FSM."""
    target_status: IncidentFSMStatus = Field(..., description="Tahap FSM tujuan yang diinginkan")
    road_width_meters: Optional[float] = Field(None, ge=0.5, le=50.0, description="Koreksi lebar jalan gang oleh operator posko")
    override_reason: Optional[str] = Field(None, description="Alasan override jika melewati tahapan atau memverifikasi pelapor tunggal")
    operator_notes: Optional[str] = Field(None, description="Catatan komando lapangan")

    @field_validator("target_status", mode="before")
    @classmethod
    def normalize_fsm_target_status(cls, v: Any) -> Any:
        if isinstance(v, str):
            status_map = {
                "REPORTED": IncidentFSMStatus.PENDING_VERIFICATION,
                "DISPATCHED": IncidentFSMStatus.DISPATCHING,
                "WATER_ON_FIRE": IncidentFSMStatus.SUPPRESSION_ACTIVE,
                "CONTROLLED": IncidentFSMStatus.OVERHAUL_COOLING,
                "RESOLVED": IncidentFSMStatus.INCIDENT_CLOSED,
                "FALSE_ALARM": IncidentFSMStatus.CANCELLED_PRANK,
            }
            if v in status_map:
                return status_map[v]
        return v


class ManualOverrideRequest(BaseModel):
    """Permintaan verifikasi paksa / override darurat oleh operator posko induk."""
    target_status: IncidentFSMStatus = Field(
        default=IncidentFSMStatus.VERIFIED,
        description="Status target hasil override (biasanya VERIFIED)",
    )
    override_reason: str = Field(
        ...,
        min_length=5,
        description="Alasan verifikasi paksa (misal: verifikasi HT Balakarcana, pelapor tunggal tengah malam)",
        examples=["Dikonfirmasi via radio HT Posko Balakarcana Jl. Pelita, pelapor tunggal dini hari sah."],
    )
    road_width_meters: Optional[float] = Field(None, ge=0.5, le=50.0, description="Koreksi lebar jalan gang oleh operator posko")
    operator_notes: Optional[str] = Field(None, description="Catatan komando operasional lapangan")

    @field_validator("target_status", mode="before")
    @classmethod
    def normalize_override_target_status(cls, v: Any) -> Any:
        if isinstance(v, str):
            status_map = {
                "REPORTED": IncidentFSMStatus.PENDING_VERIFICATION,
                "DISPATCHED": IncidentFSMStatus.DISPATCHING,
                "WATER_ON_FIRE": IncidentFSMStatus.SUPPRESSION_ACTIVE,
                "CONTROLLED": IncidentFSMStatus.OVERHAUL_COOLING,
                "RESOLVED": IncidentFSMStatus.INCIDENT_CLOSED,
                "FALSE_ALARM": IncidentFSMStatus.CANCELLED_PRANK,
            }
            if v in status_map:
                return status_map[v]
        return v



class FSMTransitionData(BaseModel):
    """Data hasil pembaruan transisi status insiden."""
    incident_id: UUID = Field(..., description="UUID insiden yang diubah")
    previous_status: IncidentFSMStatus = Field(..., description="Status sebelum transisi")
    current_status: IncidentFSMStatus = Field(..., description="Status baru setelah transisi")
    dispatch_protocol: Optional[str] = Field(None, description="Protokol dispatch aktif, misal AUTO_SPLIT_NARROW_ALLEY")
    updated_at: datetime = Field(..., description="Stempel waktu transisi disahkan peladen")


class FSMTransitionResponse(BaseModel):
    """Respons terstandarisasi transisi status FSM."""
    status: Literal["success"] = "success"
    data: FSMTransitionData


class IncidentUnitItem(BaseModel):
    """Informasi armada yang ditugaskan pada insiden."""
    unit_id: UUID = Field(..., description="UUID unik unit")
    unit_identifier: str = Field(..., description="Kode panggil unit")
    vehicle_type: VehicleType = Field(..., description="Tipe kendaraan")
    water_capacity_liters: int = Field(..., description="Kapasitas tangki air dalam liter")
    assigned_role: TacticalRole = Field(..., description="Peran taktis yang diemban")
    current_location: GeoPoint = Field(..., description="Koordinat posisi terkini unit")


class IncidentDetailData(BaseModel):
    """Informasi komprehensif insiden untuk dasbor komando dan mobile relawan."""
    incident_id: UUID = Field(..., description="UUID unik insiden")
    incident_code: str = Field(..., description="Kode registrasi insiden")
    street_address: str = Field(..., description="Alamat lokasi kejadian")
    epicenter: GeoPoint = Field(..., description="Titik koordinat episentrum kebakaran")
    road_width_meters: float = Field(..., description="Lebar akses jalan masuk terdekat")
    status: IncidentFSMStatus = Field(..., description="Status tahapan FSM terkini")
    reported_at: datetime = Field(..., description="Waktu awal laporan diterima")
    verified_at: Optional[datetime] = Field(None, description="Waktu terverifikasi")
    closed_at: Optional[datetime] = Field(None, description="Waktu insiden resmi ditutup")
    allocated_units: List[IncidentUnitItem] = Field(default_factory=list, description="Daftar unit yang telah bergabung")


class IncidentDetailResponse(BaseModel):
    """Respons detail insiden."""
    status: Literal["success"] = "success"
    data: IncidentDetailData


class IncidentListItem(BaseModel):
    """Informasi ringkas antrean insiden untuk dasbor komando web dan peta taktis."""
    incident_id: UUID = Field(..., description="UUID unik insiden")
    incident_code: str = Field(..., description="Kode registrasi taktis insiden", examples=["HT-2026-089"])
    title: str = Field(..., description="Nama atau ringkasan lokasi insiden", examples=["Gg. 4 Jl. Pelita"])
    street_address: str = Field(..., description="Alamat lengkap lokasi kebakaran")
    coordinates: List[float] = Field(..., description="Koordinat [latitude, longitude] WGS 84")
    status: IncidentFSMStatus = Field(..., description="Tahap siklus status FSM insiden")
    reporters_count: int = Field(1, description="Jumlah pelapor unik dalam klaster")
    consensus_target: int = Field(2, description="Target jumlah pelapor untuk verifikasi otomatis")
    cluster_radius_meters: float = Field(100.0, description="Radius konsensus spasial dalam meter")
    road_width_meters: float = Field(2.0, description="Estimasi lebar gang dalam meter")
    reported_at: datetime = Field(..., description="Stempel waktu awal insiden dilaporkan")
    updated_at: datetime = Field(..., description="Stempel waktu pembaruan status insiden")


class IncidentListResponse(BaseModel):
    """Respons daftar seluruh antrean insiden aktif."""
    status: Literal["success"] = "success"
    data: List[IncidentListItem]

