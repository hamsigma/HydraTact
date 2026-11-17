import math
from typing import Dict, Any

CARDINAL_MAP = [
    {"code": "U", "label": "Utara", "min": 337.5, "max": 360.0},
    {"code": "U", "label": "Utara", "min": 0.0, "max": 22.5},
    {"code": "TL", "label": "Timur Laut", "min": 22.5, "max": 67.5},
    {"code": "T", "label": "Timur", "min": 67.5, "max": 112.5},
    {"code": "TG", "label": "Tenggara", "min": 112.5, "max": 157.5},
    {"code": "S", "label": "Selatan", "min": 157.5, "max": 202.5},
    {"code": "BD", "label": "Barat Daya", "min": 202.5, "max": 247.5},
    {"code": "B", "label": "Barat", "min": 247.5, "max": 292.5},
    {"code": "BL", "label": "Barat Laut", "min": 292.5, "max": 337.5},
]

def calculate_compass_bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> Dict[str, Any]:
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lng2 - lng1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)

    theta = math.atan2(y, x)
    bearing_degrees = round((math.degrees(theta) + 360.0) % 360.0)

    match = next((c for c in CARDINAL_MAP if c["min"] <= bearing_degrees < c["max"]), CARDINAL_MAP[0])

    return {
        "bearing_degrees": bearing_degrees,
        "cardinal_indonesian": match["code"],
        "description": f"{match['label']} ({bearing_degrees}°)",
    }
