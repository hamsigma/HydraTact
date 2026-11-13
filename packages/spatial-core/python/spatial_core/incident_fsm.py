"""Finite State Machine (FSM) Siklus Hidup Insiden Kebakaran.

File: packages/spatial-core/python/spatial_core/incident_fsm.py
PIC: @Hervino (TASK-204)
Single Source of Truth: docs/Architecture.md §5.3 & docs/PRD.md
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple


class IncidentFSMStatus(str, Enum):
    """Status siklus hidup insiden kebakaran pada Finite State Machine (FSM)."""
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    DISPATCHING = "DISPATCHING"
    SUPPRESSION_ACTIVE = "SUPPRESSION_ACTIVE"
    OVERHAUL_COOLING = "OVERHAUL_COOLING"
    INCIDENT_CLOSED = "INCIDENT_CLOSED"
    ARCHIVED = "ARCHIVED"
    CANCELLED_PRANK = "CANCELLED_PRANK"


ALLOWED_FSM_TRANSITIONS: Dict[str, List[str]] = {
    IncidentFSMStatus.PENDING_VERIFICATION.value: [
        IncidentFSMStatus.VERIFIED.value,
        IncidentFSMStatus.CANCELLED_PRANK.value,
        IncidentFSMStatus.ARCHIVED.value,
    ],
    IncidentFSMStatus.VERIFIED.value: [
        IncidentFSMStatus.DISPATCHING.value,
        IncidentFSMStatus.CANCELLED_PRANK.value,
        IncidentFSMStatus.ARCHIVED.value,
    ],
    IncidentFSMStatus.DISPATCHING.value: [
        IncidentFSMStatus.SUPPRESSION_ACTIVE.value,
        IncidentFSMStatus.CANCELLED_PRANK.value,
        IncidentFSMStatus.ARCHIVED.value,
    ],
    IncidentFSMStatus.SUPPRESSION_ACTIVE.value: [
        IncidentFSMStatus.OVERHAUL_COOLING.value,
        IncidentFSMStatus.DISPATCHING.value,
    ],
    IncidentFSMStatus.OVERHAUL_COOLING.value: [
        IncidentFSMStatus.INCIDENT_CLOSED.value,
        IncidentFSMStatus.SUPPRESSION_ACTIVE.value,
    ],
    IncidentFSMStatus.INCIDENT_CLOSED.value: [
        IncidentFSMStatus.ARCHIVED.value,
        IncidentFSMStatus.OVERHAUL_COOLING.value,
    ],
    IncidentFSMStatus.CANCELLED_PRANK.value: [
        IncidentFSMStatus.ARCHIVED.value,
    ],
    IncidentFSMStatus.ARCHIVED.value: [],
}


def is_valid_fsm_transition(
    current_status: str,
    target_status: str,
    is_override: bool = False,
) -> Tuple[bool, Optional[str]]:
    """Memvalidasi apakah transisi status dari status saat ini ke status target sah.

    Mengembalikan (is_valid, error_reason).
    """
    if current_status == target_status:
        return False, f"Status tujuan sama dengan status saat ini ({current_status})."

    if current_status == IncidentFSMStatus.ARCHIVED.value:
        return False, "Insiden yang telah diarsipkan (ARCHIVED) adalah status terminal dan tidak dapat diubah kembali."

    allowed_next = ALLOWED_FSM_TRANSITIONS.get(current_status, [])

    if target_status in allowed_next:
        return True, None

    if is_override:
        # Override dari PENDING_VERIFICATION langsung ke VERIFIED atau CANCELLED_PRANK
        if (
            current_status == IncidentFSMStatus.PENDING_VERIFICATION.value
            and target_status in [IncidentFSMStatus.VERIFIED.value, IncidentFSMStatus.CANCELLED_PRANK.value]
        ):
            return True, None

        # Posko membatalkan insiden kapan saja
        if target_status in [IncidentFSMStatus.CANCELLED_PRANK.value, IncidentFSMStatus.ARCHIVED.value]:
            return True, None

        # Langsung ke SUPPRESSION_ACTIVE jika unit sudah tiba
        if (
            current_status == IncidentFSMStatus.VERIFIED.value
            and target_status == IncidentFSMStatus.SUPPRESSION_ACTIVE.value
        ):
            return True, None

    return (
        False,
        f"Transisi status tidak valid dari '{current_status}' ke '{target_status}'. Tahap yang diizinkan: [{', '.join(allowed_next)}].",
    )


def determine_dispatch_protocol(road_width_meters: float, status: str) -> Optional[str]:
    """Menentukan protokol dispatch operasional berdasarkan lebar jalan dan tahap FSM."""
    if status in [IncidentFSMStatus.DISPATCHING.value, IncidentFSMStatus.SUPPRESSION_ACTIVE.value]:
        if road_width_meters < 2.5:
            return "AUTO_SPLIT_NARROW_ALLEY"
        return "DIRECT_ATTACK_WIDE_ROAD"
    return None


def execute_fsm_transition(
    incident: Dict[str, Any],
    target_status: str,
    road_width_meters: Optional[float] = None,
    override_reason: Optional[str] = None,
    operator_notes: Optional[str] = None,
    is_manual_override: bool = False,
) -> Dict[str, Any]:
    """Mengeksekusi transisi status FSM insiden kebakaran dan memperbarui stempel waktu operasional."""
    current_status = str(incident.get("status", incident.get("fsm_status", "")))
    effective_override = is_manual_override or bool(override_reason)

    is_valid, reason = is_valid_fsm_transition(current_status, target_status, effective_override)
    if not is_valid:
        raise ValueError(reason or "Transisi status FSM tidak sah.")

    effective_road_width = float(
        road_width_meters if road_width_meters is not None and road_width_meters > 0
        else incident.get("road_width_meters", 2.0)
    )

    now_iso = datetime.now(timezone.utc).isoformat()

    verified_at = incident.get("verified_at")
    if target_status == IncidentFSMStatus.VERIFIED.value and not verified_at:
        verified_at = now_iso

    closed_at = incident.get("closed_at")
    if target_status == IncidentFSMStatus.INCIDENT_CLOSED.value and not closed_at:
        closed_at = now_iso

    dispatch_protocol = determine_dispatch_protocol(effective_road_width, target_status)

    return {
        "incident_id": incident.get("id", incident.get("incident_id")),
        "previous_status": current_status,
        "current_status": target_status,
        "road_width_meters": effective_road_width,
        "verified_at": verified_at,
        "closed_at": closed_at,
        "is_manual_override": effective_override,
        "override_reason": override_reason,
        "operator_notes": operator_notes,
        "dispatch_protocol": dispatch_protocol,
        "updated_at": now_iso,
    }
