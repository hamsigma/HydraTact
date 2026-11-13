from uuid import UUID
from fastapi import APIRouter, HTTPException, Path, status

from app.core.db import get_db_pool
from app.repositories.spatial import (
    fetch_incident_detail_by_id,
    process_citizen_incident_report,
)
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
    """Menerima laporan darurat warga dan mengevaluasi konsensus spasial anti-prank."""
    pool = get_db_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            data = await process_citizen_incident_report(conn, payload)
            return IncidentReportResponse(status="success", data=data)

    data = await process_citizen_incident_report(None, payload)
    return IncidentReportResponse(status="success", data=data)


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
    """Mengambil detail komprehensif insiden kebakaran aktif."""
    pool = get_db_pool()
    detail = None
    if pool is not None:
        async with pool.acquire() as conn:
            detail = await fetch_incident_detail_by_id(conn, incident_id)
    else:
        detail = await fetch_incident_detail_by_id(None, incident_id)

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insiden dengan ID '{incident_id}' tidak ditemukan.",
        )
    return IncidentDetailResponse(status="success", data=detail)



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
