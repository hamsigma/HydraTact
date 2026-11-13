from uuid import UUID
from fastapi import APIRouter, Path, status

from app.schemas.incident import (
    CitizenReportRequest,
    FSMTransitionRequest,
    FSMTransitionResponse,
    IncidentDetailResponse,
    IncidentReportResponse,
)
from app.schemas.unit import (
    UnitAssignRequest,
    UnitAssignResponse,
)

router = APIRouter(prefix="/incidents", tags=["Komando Insiden & Pelaporan"])


@router.post(
    "/report",
    response_model=IncidentReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Kirim laporan darurat warga dan jalankan evaluasi konsensus spasial",
    description="Menerima titik koordinat pelapor (1-tap SOS) dan mengevaluasi konsensus spasial radius 100m serta selang waktu 3 menit.",
)
async def report_incident(payload: CitizenReportRequest):
    """Placeholder implementasi kontrak endpoint pelaporan warga."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")


@router.get(
    "/{incident_id}",
    response_model=IncidentDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Ambil detail insiden kebakaran aktif",
    description="Mengambil detail insiden aktif, lebar gang terdeteksi, unit teralokasi, dan barikade selang.",
)
async def get_incident_detail(
    incident_id: UUID = Path(..., description="UUID unik insiden kebakaran"),
):
    """Placeholder implementasi kontrak endpoint detail insiden."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")


@router.patch(
    "/{incident_id}/transition",
    response_model=FSMTransitionResponse,
    status_code=status.HTTP_200_OK,
    summary="Transisi siklus hidup insiden (FSM) oleh operator posko",
    description="Mengatur perpindahan tahap operasi Finite State Machine secara deterministik dan koreksi lebar jalan.",
)
async def transition_incident_fsm(
    payload: FSMTransitionRequest,
    incident_id: UUID = Path(..., description="UUID unik insiden kebakaran"),
):
    """Placeholder implementasi kontrak endpoint transisi FSM."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")


@router.post(
    "/{incident_id}/units/assign",
    response_model=UnitAssignResponse,
    status_code=status.HTTP_200_OK,
    summary="Daftarkan armada dan hitung peran otomatis (Dynamic Role Dispatching)",
    description="Mendaftarkan unit ke insiden dan menghitung peran otomatis ATTACKER vs FEEDER berdasarkan lebar gang dan kapasitas tangki.",
)
async def assign_unit_to_incident(
    payload: UnitAssignRequest,
    incident_id: UUID = Path(..., description="UUID unik insiden kebakaran"),
):
    """Placeholder implementasi kontrak endpoint assign armada."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")
