import logging
from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException, Path, Request, status

from app.core.db import get_db_pool
from app.core.limiter import limiter
from app.repositories.incident_fsm import transition_incident_fsm_repo
from app.repositories.spatial import (
    fetch_active_incidents,
    fetch_incident_detail_by_id,
    process_citizen_incident_report,
)
from app.schemas.common import GeoPoint, TacticalRole
from app.schemas.incident import (
    CitizenReportRequest,
    FSMTransitionRequest,
    FSMTransitionResponse,
    IncidentDetailResponse,
    IncidentListResponse,
    IncidentReportResponse,
    ManualOverrideRequest,
)
from app.schemas.unit import (
    UnitAssignData,
    UnitAssignRequest,
    UnitAssignResponse,
)
from spatial_core import determine_tactical_role, evaluate_road_access_role

logger = logging.getLogger("hydratact.incidents")

router = APIRouter(prefix="/incidents", tags=["Komando Insiden & Pelaporan"])


@router.post(
    "/report",
    response_model=IncidentReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Kirim laporan darurat warga dan jalankan evaluasi konsensus spasial",
    description="Menerima titik koordinat pelapor (1-tap SOS) dan mengevaluasi konsensus spasial radius 100m serta selang waktu 3 menit.",
)
@limiter.limit("3/minute")
async def report_incident(request: Request, payload: CitizenReportRequest):
    """Menerima laporan darurat warga dan mengevaluasi konsensus spasial anti-prank."""
    pool = get_db_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            data = await process_citizen_incident_report(conn, payload)
            return IncidentReportResponse(status="success", data=data)

    data = await process_citizen_incident_report(None, payload)
    return IncidentReportResponse(status="success", data=data)


@router.get(
    "",
    response_model=IncidentListResponse,
    status_code=status.HTTP_200_OK,
    summary="Ambil seluruh antrean insiden kebakaran aktif",
    description="Mengambil seluruh insiden aktif dalam wilayah operasional Samarinda untuk dasbor posko.",
)
@router.get(
    "/",
    response_model=IncidentListResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
async def list_active_incidents():
    """Mengambil seluruh daftar antrean insiden kebakaran aktif untuk posko komando."""
    pool = get_db_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            incidents = await fetch_active_incidents(conn)
            return IncidentListResponse(status="success", data=incidents)

    incidents = await fetch_active_incidents(None)
    return IncidentListResponse(status="success", data=incidents)


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
@router.post(
    "/{incident_id}/transition",
    response_model=FSMTransitionResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
async def transition_incident_fsm(
    payload: FSMTransitionRequest,
    incident_id: UUID = Path(..., description="UUID unik insiden kebakaran"),
):
    """Mengeksekusi transisi status FSM insiden kebakaran oleh operator posko."""
    pool = get_db_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            data = await transition_incident_fsm_repo(conn, incident_id, payload)
            return FSMTransitionResponse(status="success", data=data)

    data = await transition_incident_fsm_repo(None, incident_id, payload)
    return FSMTransitionResponse(status="success", data=data)


@router.post(
    "/{incident_id}/override",
    response_model=FSMTransitionResponse,
    status_code=status.HTTP_200_OK,
    summary="Manual Override verifikasi paksa oleh operator posko induk",
    description="Melakukan verifikasi paksa insiden pelapor tunggal atau pembatalan darurat oleh operator posko.",
)
async def manual_override_incident(
    payload: ManualOverrideRequest,
    incident_id: UUID = Path(..., description="UUID unik insiden kebakaran"),
):
    """Mengeksekusi Manual Override oleh operator posko induk."""
    transition_payload = FSMTransitionRequest(
        target_status=payload.target_status,
        road_width_meters=payload.road_width_meters,
        override_reason=payload.override_reason,
        operator_notes=payload.operator_notes,
    )
    pool = get_db_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            data = await transition_incident_fsm_repo(
                conn, incident_id, transition_payload, is_override=True
            )
            return FSMTransitionResponse(status="success", data=data)

    data = await transition_incident_fsm_repo(
        None, incident_id, transition_payload, is_override=True
    )
    return FSMTransitionResponse(status="success", data=data)



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
    """Mendaftarkan unit dan menghitung peran otomatis berbasis lebar gang dan kapasitas tangki."""
    pool = get_db_pool()
    effective_width = 2.0  # default lebar gang Jl. Pelita Gg. 4
    unit_id = uuid4()

    if pool is not None:
        try:
            async with pool.acquire() as conn:
                width_row = await conn.fetchval(
                    "SELECT road_width_meters FROM incidents WHERE id = $1",
                    incident_id,
                )
                if width_row:
                    effective_width = float(width_row)
        except Exception as exc:
            logger.warning(f"Error fetching incident width: {exc}")

    eval_res = evaluate_road_access_role(
        road_width_meters=effective_width,
        tank_capacity_liters=payload.water_capacity_liters,
        incident_coords=(117.1628, -0.4848),
        arterial_coords=(117.1639, -0.4839),
    )
    role_str = eval_res["assigned_role"]
    rationale = eval_res["dispatch_rationale"]
    instruction = eval_res["tactical_instruction"]
    staging_pt = GeoPoint(type="Point", coordinates=eval_res["arterial_staging_point"])
    attack_pt = GeoPoint(type="Point", coordinates=eval_res["attack_entry_point"])

    if role_str == "FEEDER":
        assigned_role = TacticalRole.FEEDER
        db_role = "FEEDER"
        paired_unit = "ATK-01"
    elif role_str == "ATTACKER":
        assigned_role = TacticalRole.ATTACKER
        db_role = "ATTACKER"
        paired_unit = "FDR-01"
    else:
        assigned_role = TacticalRole.DIRECT_ATTACK if hasattr(TacticalRole, "DIRECT_ATTACK") else TacticalRole.ATTACKER
        db_role = role_str
        paired_unit = None

    if pool is not None:
        try:
            async with pool.acquire() as conn:
                vehicle_mapping = {
                    "LARGE_TANK": "TANKER_DOUBLE_AXLE",
                    "MEDIUM_TANK": "TANKER_SINGLE_AXLE",
                    "THREE_WHEELER": "PICKUP_4X4",
                    "PORTABLE_PUMP": "PORTABLE_PORT",
                }
                v_type = vehicle_mapping.get(
                    payload.vehicle_type.value if hasattr(payload.vehicle_type, "value") else str(payload.vehicle_type),
                    "PICKUP_4X4",
                )
                insert_sql = """
                    INSERT INTO incident_units (
                        id, incident_id, unit_code, vehicle_type, water_capacity_liters,
                        assigned_role, current_geom, last_ping_at, created_at
                    ) VALUES (
                        $1, $2, $3, $4::fleet_vehicle_type, $5,
                        $6::tactical_unit_role, ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography, NOW(), NOW()
                    )
                    RETURNING id;
                """
                inserted_id = await conn.fetchval(
                    insert_sql,
                    unit_id,
                    incident_id,
                    payload.unit_identifier,
                    v_type,
                    payload.water_capacity_liters,
                    db_role,
                    payload.current_location.coordinates[0],
                    payload.current_location.coordinates[1],
                )
                if inserted_id:
                    unit_id = inserted_id
        except Exception as exc:
            logger.warning(f"Error persisting unit assignment in db: {exc}")

    data = UnitAssignData(
        unit_id=unit_id,
        unit_identifier=payload.unit_identifier,
        assigned_role=assigned_role,
        dispatch_rationale=rationale,
        tactical_instruction=instruction,
        paired_unit=paired_unit,
        arterial_staging_point=staging_pt,
        attack_entry_point=attack_pt,
    )
    return UnitAssignResponse(status="success", data=data)
