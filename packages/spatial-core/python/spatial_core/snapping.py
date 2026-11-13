"""Algoritma Client-Side Map-Matching Snapping (Mitigasi GPS Multipath Drift).

File: packages/spatial-core/python/spatial_core/snapping.py
PIC: @Ilham (TASK-402)
"""

from typing import Any, Dict, List, Optional, Tuple
from . import haversine_distance_meters


def project_point_to_segment(
    point: Tuple[float, float],
    seg_a: Tuple[float, float],
    seg_b: Tuple[float, float],
) -> Tuple[Tuple[float, float], float]:
    """Memproyeksikan titik P (lon, lat) ke segmen garis AB."""
    px, py = point
    ax, ay = seg_a
    bx, by = seg_b

    dx = bx - ax
    dy = by - ay
    len_sq = dx * dx + dy * dy

    if len_sq == 0:
        dist = haversine_distance_meters(py, px, ay, ax)
        return seg_a, dist

    t = ((px - ax) * dx + (py - ay) * dy) / len_sq
    t = max(0.0, min(1.0, t))

    proj_x = round(ax + t * dx, 6)
    proj_y = round(ay + t * dy, 6)
    proj_point = (proj_x, proj_y)

    dist = haversine_distance_meters(py, px, proj_y, proj_x)
    return proj_point, dist


def snap_coordinates_to_road_network(
    raw_coordinates: Tuple[float, float],
    road_network: List[Dict[str, Any]],
    max_deviation_meters: float = 25.0,
) -> Dict[str, Any]:
    """Mengunci koordinat mentah GPS ke jaringan segmen jalan terdekat (TASK-402)."""
    if not road_network:
        return {
            "original_coordinates": raw_coordinates,
            "snapped_coordinates": raw_coordinates,
            "deviation_meters": 0.0,
            "is_snapped": False,
            "snapped_road_name": None,
            "detected_road_width_meters": None,
        }

    min_dist = float("inf")
    best_point = raw_coordinates
    best_segment: Optional[Dict[str, Any]] = None

    for seg in road_network:
        proj_pt, dist = project_point_to_segment(
            raw_coordinates, seg["start_point"], seg["end_point"]
        )
        if dist < min_dist:
            min_dist = dist
            best_point = proj_pt
            best_segment = seg

    is_snapped = min_dist <= max_deviation_meters and best_segment is not None

    return {
        "original_coordinates": raw_coordinates,
        "snapped_coordinates": best_point if is_snapped else raw_coordinates,
        "deviation_meters": round(min_dist, 2),
        "is_snapped": is_snapped,
        "snapped_road_name": best_segment["road_name"] if is_snapped and best_segment else None,
        "detected_road_width_meters": best_segment["road_width_meters"] if is_snapped and best_segment else None,
    }
