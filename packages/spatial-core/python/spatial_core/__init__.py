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


def calculate_estimated_travel_minutes(distance_meters: float, average_speed_kmh: float = 30.0) -> float:
    """Menghitung estimasi waktu tempuh armada dalam menit."""
    speed_meters_per_minute = (average_speed_kmh * 1000.0) / 60.0
    return round(distance_meters / speed_meters_per_minute, 1)


def find_nearest_water_sources(
    current_lat: float,
    current_lng: float,
    sources: List[Dict[str, Any]],
    limit: int = 3,
    include_low_discharge: bool = True,
) -> List[Dict[str, Any]]:
    """Menyortir N sumber air terdekat menggunakan rumus Haversine."""
    candidates = []
    for s in sources:
        status = str(s.get("status") or s.get("operational_status") or "READY").upper()
        if status in ("EMPTY", "DAMAGED"):
            continue
        if not include_low_discharge and status == "LOW_DISCHARGE":
            continue

        s_lat = s.get("lat") if "lat" in s else s.get("coordinates", [0, 0])[0]
        s_lng = s.get("lng") if "lng" in s else s.get("coordinates", [0, 0])[1]

        dist = haversine_distance_meters(current_lat, current_lng, s_lat, s_lng)
        eta = calculate_estimated_travel_minutes(dist)

        item = dict(s)
        item["distance_meters"] = dist
        item["estimated_travel_minutes"] = eta
        candidates.append(item)

    candidates.sort(key=lambda x: x["distance_meters"])
    return candidates[:limit]


def evaluate_tidal_suction_viability(
    timestamp: Optional[datetime] = None,
    nominal_discharge_lpm: int = 2800,
) -> Dict[str, Any]:
    """Menghitung elevasi air pasang surut Sungai Karang Mumus dan kelayakan hisap pompa apung."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)
    elif timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    hours = timestamp.hour + timestamp.minute / 60.0
    period = 12.4
    peak_hour = 2.0
    mean_elevation = 0.8
    amplitude = 1.0

    phase_angle = (2.0 * math.pi * (hours - peak_hour)) / period
    elevation = round(mean_elevation + amplitude * math.cos(phase_angle), 2)

    min_threshold = 0.2
    is_viable = elevation >= min_threshold

    if elevation >= 1.2:
        phase = "HIGH_TIDE"
        status = "READY"
        effective_discharge = nominal_discharge_lpm
        notes = f"Pasang optimal ({elevation:.2f}m). Pompa apung dapat menyedot debit maksimal."
    elif elevation >= min_threshold:
        phase = "EBBING" if math.sin(phase_angle) > 0 else "FLOODING"
        status = "READY"
        effective_discharge = int(nominal_discharge_lpm * 0.85)
        notes = f"Permukaan air memadai ({elevation:.2f}m). Hisap apung beroperasi normal."
    else:
        phase = "LOW_TIDE"
        status = "SUCTION_UNAVAILABLE_LOW_TIDE"
        effective_discharge = 0
        notes = f"Surut kritis ({elevation:.2f}m < ambang {min_threshold}m). Pompa apung berisiko menyedot lumpur dasar SKM. Alihkan ke hidran PDAM."

    return {
        "water_elevation_meters": elevation,
        "is_viable": is_viable,
        "status": status,
        "effective_discharge_lpm": effective_discharge,
        "tidal_phase": phase,
        "recommended_alternative_type": "HYDRANT",
        "notes": notes,
    }




def evaluate_geofencing_consensus(
    reports: List[Dict[str, Any]],
    target_lat: float,
    target_lon: float,
    reference_time: Optional[datetime] = None,
    cluster_radius_meters: float = 100.0,
    time_window_seconds: int = 180,
    min_reporters_required: int = 2,
    cooldown_seconds: int = 60,
) -> Dict[str, Any]:
    """Mengevaluasi laporan darurat warga untuk konsensus anti-prank (TASK-202).

    Kriteria: r <= 100 meter, dt <= 3 menit (180s), >= 2 pelapor unik,
    atau bypass pelapor tunggal dengan GPS presisi (< 15m) dan hash foto valid.
    """
    if reference_time is None:
        reference_time = datetime.now(timezone.utc)
    elif reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=timezone.utc)

    unique_phones: Set[str] = set()
    phone_last_report: Dict[str, datetime] = {}
    has_valid_bypass = False

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

                    # Cooldown anti-spam
                    if phone in phone_last_report:
                        if abs((r_time - phone_last_report[phone]).total_seconds()) < cooldown_seconds:
                            continue

                    phone_last_report[phone] = r_time
                    if phone:
                        unique_phones.add(phone)

                    # Bypass rule
                    acc = r.get("gps_accuracy_meters")
                    p_hash = str(r.get("photo_hash", ""))
                    if acc is not None and float(acc) <= 15.0 and len(p_hash) >= 8:
                        has_valid_bypass = True

    unique_count = len(unique_phones)
    is_verified = unique_count >= min_reporters_required or has_valid_bypass

    if has_valid_bypass:
        status_msg = "Terverifikasi via GPS Presisi Tinggi (< 15m) & Bukti Visual Foto."
    elif unique_count >= min_reporters_required:
        status_msg = f"Konsensus tercapai: {unique_count}/{min_reporters_required} laporan warga terverifikasi."
    elif unique_count == 1:
        status_msg = f"1/{min_reporters_required} Laporan terdeteksi - Menunggu konfirmasi warga sekitar..."
    else:
        status_msg = "Nihil laporan valid dalam radius dan jeda waktu aktif."

    return {
        "is_verified": is_verified,
        "is_high_confidence_bypass": has_valid_bypass,
        "unique_reporters_count": unique_count,
        "cluster_radius_meters": cluster_radius_meters,
        "time_window_seconds": time_window_seconds,
        "allow_manual_override": not is_verified,
        "status_message": status_msg,
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


def evaluate_road_access_role(
    road_width_meters: float,
    tank_capacity_liters: int,
    incident_coords: Optional[Tuple[float, float]] = None,
    arterial_coords: Optional[Tuple[float, float]] = None,
) -> Dict[str, Any]:
    """Mengevaluasi peran armada dan titik staging/attack berdasarkan akses jalan."""
    if incident_coords is None:
        incident_coords = (117.1628, -0.4848)
    if arterial_coords is None:
        arterial_coords = (117.1639, -0.4839)

    role = determine_tactical_role(road_width_meters, tank_capacity_liters)

    if road_width_meters < 2.5:
        if tank_capacity_liters >= 3000:
            rationale = (
                f"Lebar akses jalan {road_width_meters:.1f}m (< 2.5m). Kapasitas tangki {tank_capacity_liters}L "
                "(>= 3.000 L) dilarang masuk gang sempit. Dialokasikan sebagai unit FEEDER penyuplai air di jalan arteri."
            )
            instruction = "Kunci posisi di jalan arteri utama (lebar >= 6m). Bentangkan selang pasok ke mulut gang dan siapkan koneksi ke sumber air terdekat."
            staging_point = arterial_coords
            attack_point = incident_coords
        else:
            rationale = (
                f"Lebar akses jalan {road_width_meters:.1f}m (< 2.5m). Unit dengan kapasitas {tank_capacity_liters}L "
                "(< 3.000 L) dapat bermanuver masuk ke gang sempit sebagai unit ATTACKER titik api."
            )
            instruction = "Masuk mendekat ke titik api. Hubungkan nozzle pemadaman ke selang pasok unit Feeder di mulut gang."
            staging_point = arterial_coords
            attack_point = incident_coords
    else:
        rationale = f"Akses jalan cukup lebar ({road_width_meters:.1f}m >= 2.5m). Unit langsung mendekat ke sektor kebakaran."
        instruction = "Akses jalan memadai. Lakukan serangan langsung ke titik api tanpa pemisahan peran feeder."
        staging_point = incident_coords
        attack_point = incident_coords

    return {
        "assigned_role": role,
        "dispatch_rationale": rationale,
        "tactical_instruction": instruction,
        "arterial_staging_point": staging_point,
        "attack_entry_point": attack_point,
    }


MIN_SAFE_PRESSURE_BAR = 4.0
MAX_SAFE_PRESSURE_BAR = 14.0
HOSE_FRICTION_COEFFICIENT_BAR_PER_METER = 0.002


def calculate_relay_hose_pressure(
    target_nozzle_bar: float,
    hose_length_meters: float = 0.0,
) -> Dict[str, Any]:
    """Menghitung kebutuhan tekanan pompa feeder dengan kompensasi kehilangan tekanan selang."""
    if target_nozzle_bar <= 0:
        return {
            "target_nozzle_bar": 0.0,
            "hose_length_meters": hose_length_meters,
            "pressure_loss_bar": 0.0,
            "required_feeder_pump_bar": 0.0,
            "is_safe_range": True,
            "warning": "EMERGENCY_SHUTOFF",
        }

    loss = round(hose_length_meters * HOSE_FRICTION_COEFFICIENT_BAR_PER_METER, 2)
    feeder_pump = round(target_nozzle_bar + loss, 2)
    is_safe = MIN_SAFE_PRESSURE_BAR <= feeder_pump <= MAX_SAFE_PRESSURE_BAR

    warning = None
    if feeder_pump > MAX_SAFE_PRESSURE_BAR:
        warning = "HOSE_BURST_RISK"
    elif feeder_pump < MIN_SAFE_PRESSURE_BAR:
        warning = "INSUFFICIENT_PRESSURE"

    return {
        "target_nozzle_bar": target_nozzle_bar,
        "hose_length_meters": hose_length_meters,
        "pressure_loss_bar": loss,
        "required_feeder_pump_bar": feeder_pump,
        "is_safe_range": is_safe,
        "warning": warning,
    }


MAX_SINGLE_STAGE_HOSE_METERS = 300.0


def generate_hose_crossing_barricade(
    incident_id: str,
    road_name: str,
    feeder_call_sign: str,
    feeder_coords: Tuple[float, float],
    attacker_coords: Tuple[float, float],
) -> Dict[str, Any]:
    """Menghasilkan data segmen barikade perlintasan selang relay fuchsia (#C026D3)."""
    dist = haversine_distance_meters(
        feeder_coords[0], feeder_coords[1],
        attacker_coords[0], attacker_coords[1]
    )
    requires_relay = dist > MAX_SINGLE_STAGE_HOSE_METERS
    warning_text = (
        f"PERINGATAN: Jalur selang relay bertekanan tinggi melintasi {road_name} ({dist:.0f}m). "
        "Jalur disterilkan dari lalu lintas kendaraan."
    )

    return {
        "id": f"barricade-{incident_id}",
        "incident_id": incident_id,
        "road_name": road_name,
        "feeder_call_sign": feeder_call_sign,
        "origin_coords": feeder_coords,
        "target_coords": attacker_coords,
        "hose_length_meters": dist,
        "color_hex": "#C026D3",
        "is_active": True,
        "requires_intermediate_relay": requires_relay,
        "traffic_warning_text": warning_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }





from .snapping import (
    project_point_to_segment,
    snap_coordinates_to_road_network,
)

from .incident_fsm import (
    IncidentFSMStatus,
    ALLOWED_FSM_TRANSITIONS,
    is_valid_fsm_transition,
    determine_dispatch_protocol,
    execute_fsm_transition,
)

from .bearing import (
    calculate_compass_bearing,
)


