"""Pustaka Model Matematis & Algoritma Spasial Murni HydraTact Samarinda.

File: packages/spatial-core/python/spatial_core/__init__.py
PIC: @Ilham (TASK-202 & TASK-203)
"""

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

EARTH_RADIUS_METERS = 6371000.0


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Menghitung jarak terestrial bola bumi WGS 84 dalam satuan meter."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(EARTH_RADIUS_METERS * c, 2)


def evaluate_geofencing_consensus(
    reports: List[Dict[str, Any]],
    target_lat: float,
    target_lon: float,
    reference_time: Optional[datetime] = None,
    cluster_radius_meters: float = 100.0,
    time_window_seconds: int = 180,
    min_reporters_required: int = 2,
) -> Dict[str, Any]:
    """Mengevaluasi laporan darurat warga untuk konsensus anti-prank (TASK-202).

    Kriteria: r <= 100 meter, dt <= 3 menit (180s), >= 2 pelapor unik.
    """
    if reference_time is None:
        reference_time = datetime.now(timezone.utc)
    elif reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=timezone.utc)

    unique_phones: Set[str] = set()

    for r in reports:
        r_time = r.get("timestamp")
        if isinstance(r_time, str):
            r_time = datetime.fromisoformat(r_time.replace("Z", "+00:00"))
        elif isinstance(r_time, (int, float)):
            r_time = datetime.fromtimestamp(r_time, tz=timezone.utc)

        if r_time is not None:
            if r_time.tzinfo is None:
                r_time = r_time.replace(tzinfo=timezone.utc)
            time_diff = abs((reference_time - r_time).total_seconds())

            if time_diff <= time_window_seconds:
                coords = r.get("coordinates", (0.0, 0.0))
                dist = haversine_distance_meters(target_lat, target_lon, coords[0], coords[1])
                if dist <= cluster_radius_meters:
                    phone = str(r.get("reporter_phone", "")).strip()
                    if phone:
                        unique_phones.add(phone)

    unique_count = len(unique_phones)
    is_verified = unique_count >= min_reporters_required

    return {
        "is_verified": is_verified,
        "unique_reporters_count": unique_count,
        "cluster_radius_meters": cluster_radius_meters,
        "time_window_seconds": time_window_seconds,
        "allow_manual_override": not is_verified,
    }


def determine_tactical_role(road_width_meters: float, tank_capacity_liters: int) -> str:
    """Menentukan peran taktis armada secara deterministik (TASK-203).

    Aturan:
    - W_road < 2.5m & Kapasitas >= 3000L -> FEEDER
    - W_road < 2.5m & Kapasitas < 1000L  -> ATTACKER
    - W_road < 2.5m & 1000L <= Kapasitas < 3000L -> RESERVE_FEEDER
    - W_road >= 2.5m -> DIRECT_ATTACK
    """
    if road_width_meters < 2.5:
        if tank_capacity_liters >= 3000:
            return "FEEDER"
        elif tank_capacity_liters < 1000:
            return "ATTACKER"
        else:
            return "RESERVE_FEEDER"
    return "DIRECT_ATTACK"

