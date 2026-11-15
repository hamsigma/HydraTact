"""Repositori Transisi Siklus Hidup Insiden (FSM) & Manual Override.

File: apps/backend-api/app/repositories/incident_fsm.py
PIC: @Hervino (TASK-204)
Single Source of Truth: docs/Architecture.md §5.3 & docs/PRD.md
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID
import asyncpg

from app.core.exceptions import (
    EntityNotFoundException,
    InvalidFSMTransitionException,
)
from app.schemas.common import IncidentFSMStatus
from app.schemas.incident import (
    FSMTransitionData,
    FSMTransitionRequest,
)

# Import logika murni dari packages/spatial-core
from spatial_core.incident_fsm import (
    ALLOWED_FSM_TRANSITIONS,
    determine_dispatch_protocol,
    is_valid_fsm_transition,
)
from spatial_core import determine_tactical_role

# Cache in-memory untuk pengujian luring/simulasi Jl. Pelita Gg. 4
SIMULATED_INCIDENTS_CACHE: Dict[UUID, Dict[str, Any]] = {
    UUID("33333333-3333-3333-3333-333333333301"): {
        "id": UUID("33333333-3333-3333-3333-333333333301"),
        "incident_code": "HT-2026-089",
        "street_address": "Jl. Pelita Gg. 4 RT 14, Kel. Pelita, Kec. Samarinda Ilir",
        "road_width_meters": 1.80,
        "status": IncidentFSMStatus.PENDING_VERIFICATION,
        "verified_at": None,
        "closed_at": None,
    }
}


async def transition_incident_fsm_repo(
    connection: Optional[asyncpg.Connection],
    incident_id: UUID,
    payload: FSMTransitionRequest,
    is_override: bool = False,
) -> FSMTransitionData:
    """Mengeksekusi transisi status siklus hidup insiden (FSM) dengan validasi protokol taktis."""
    target_status_val = payload.target_status.value
    effective_override = is_override or bool(payload.override_reason)

    current_status_val: Optional[str] = None
    road_width_meters: float = 2.0
    now_utc = datetime.now(timezone.utc)

    # 1. Periksa basis data jika koneksi asyncpg aktif
    if connection is not None:
        try:
            fetch_sql = """
                SELECT id, incident_code, road_width_meters, fsm_status::text AS status,
                       verified_at, closed_at
                FROM incidents
                WHERE id = $1;
            """
            row = await connection.fetchrow(fetch_sql, incident_id)
            if not row:
                raise EntityNotFoundException("Insiden", incident_id)

            current_status_val = row["status"]
            road_width_meters = float(row["road_width_meters"])

            # Validasi aturan FSM
            is_valid, reason = is_valid_fsm_transition(
                current_status_val,
                target_status_val,
                is_override=effective_override,
            )
            if not is_valid:
                allowed_next = ALLOWED_FSM_TRANSITIONS.get(current_status_val, [])
                raise InvalidFSMTransitionException(
                    current_status=current_status_val,
                    target_status=target_status_val,
                    allowed_statuses=allowed_next,
                )

            effective_width = (
                payload.road_width_meters
                if payload.road_width_meters is not None and payload.road_width_meters > 0
                else road_width_meters
            )

            # Eksekusi pembaruan ke tabel incidents
            update_sql = """
                UPDATE incidents
                SET 
                    fsm_status = $1::incident_fsm_status,
                    road_width_meters = COALESCE($2, road_width_meters),
                    verified_at = CASE 
                        WHEN $1::incident_fsm_status = 'VERIFIED' AND verified_at IS NULL THEN NOW() 
                        ELSE verified_at 
                    END,
                    closed_at = CASE 
                        WHEN $1::incident_fsm_status = 'INCIDENT_CLOSED' AND closed_at IS NULL THEN NOW() 
                        ELSE closed_at 
                    END,
                    updated_at = NOW()
                WHERE id = $3
                RETURNING id, fsm_status::text AS current_status, road_width_meters, updated_at;
            """
            updated_row = await connection.fetchrow(
                update_sql,
                target_status_val,
                payload.road_width_meters,
                incident_id,
            )

            protocol = determine_dispatch_protocol(effective_width, target_status_val)

            # Kalkulasi ulang peran taktis unit yang dialokasikan (Dynamic Role Dispatching)
            try:
                units = await connection.fetch(
                    "SELECT id, water_capacity_liters FROM incident_units WHERE incident_id = $1",
                    incident_id,
                )
                for unit_row in units:
                    new_role = determine_tactical_role(effective_width, unit_row["water_capacity_liters"])
                    db_role = "FEEDER" if new_role in ("FEEDER", "RESERVE_FEEDER") else ("ATTACKER" if new_role == "ATTACKER" else "RESERVE")
                    await connection.execute(
                        "UPDATE incident_units SET assigned_role = $1::tactical_unit_role WHERE id = $2",
                        db_role,
                        unit_row["id"],
                    )
            except Exception as unit_exc:
                logger.warning(f"Gagal mengalkulasi ulang unit dispatch: {unit_exc}")

            return FSMTransitionData(
                incident_id=updated_row["id"],
                previous_status=IncidentFSMStatus(current_status_val),
                current_status=IncidentFSMStatus(updated_row["current_status"]),
                dispatch_protocol=protocol,
                updated_at=updated_row["updated_at"],
            )
        except (EntityNotFoundException, InvalidFSMTransitionException):
            raise
        except Exception as e:
            # Jika database koneksi bermasalah di lokal, teruskan ke fallback simulasi jika terdaftar
            if incident_id not in SIMULATED_INCIDENTS_CACHE:
                raise

    # 2. Fallback in-memory untuk pengujian luring/simulasi
    if incident_id not in SIMULATED_INCIDENTS_CACHE:
        from app.repositories.spatial import _in_memory_incident_clusters
        cluster_match = next((c for c in _in_memory_incident_clusters if c["incident_id"] == incident_id), None)
        if cluster_match:
            SIMULATED_INCIDENTS_CACHE[incident_id] = {
                "id": incident_id,
                "incident_code": cluster_match["incident_code"],
                "street_address": cluster_match["address"],
                "road_width_meters": cluster_match["road_width"],
                "status": cluster_match["status"],
                "verified_at": datetime.now(timezone.utc) if cluster_match.get("is_verified") else None,
                "closed_at": None,
            }
        else:
            raise EntityNotFoundException("Insiden", incident_id)

    incident_data = SIMULATED_INCIDENTS_CACHE[incident_id]
    current_status_val = incident_data["status"].value if isinstance(incident_data["status"], IncidentFSMStatus) else str(incident_data["status"])
    road_width_meters = float(incident_data.get("road_width_meters", 2.0))

    is_valid, reason = is_valid_fsm_transition(
        current_status_val,
        target_status_val,
        is_override=effective_override,
    )
    if not is_valid:
        allowed_next = ALLOWED_FSM_TRANSITIONS.get(current_status_val, [])
        raise InvalidFSMTransitionException(
            current_status=current_status_val,
            target_status=target_status_val,
            allowed_statuses=allowed_next,
        )

    effective_width = (
        payload.road_width_meters
        if payload.road_width_meters is not None and payload.road_width_meters > 0
        else road_width_meters
    )

    # Simpan pembaruan status
    incident_data["status"] = IncidentFSMStatus(target_status_val)
    incident_data["road_width_meters"] = effective_width

    # Sinkronisasi status ke klaster in-memory spasial jika ada
    from app.repositories.spatial import _in_memory_incident_clusters
    for c in _in_memory_incident_clusters:
        if c["incident_id"] == incident_id:
            c["status"] = IncidentFSMStatus(target_status_val)
            break
    if target_status_val == IncidentFSMStatus.VERIFIED.value and not incident_data.get("verified_at"):
        incident_data["verified_at"] = now_utc
    if target_status_val == IncidentFSMStatus.INCIDENT_CLOSED.value and not incident_data.get("closed_at"):
        incident_data["closed_at"] = now_utc

    protocol = determine_dispatch_protocol(effective_width, target_status_val)

    return FSMTransitionData(
        incident_id=incident_id,
        previous_status=IncidentFSMStatus(current_status_val),
        current_status=IncidentFSMStatus(target_status_val),
        dispatch_protocol=protocol,
        updated_at=now_utc,
    )
