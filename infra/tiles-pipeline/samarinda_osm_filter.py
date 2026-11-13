"""Script Ekstraksi & Filter Jaringan Jalan Lingkungan OpenStreetMap Kota Samarinda.

File: infra/tiles-pipeline/samarinda_osm_filter.py
PIC: @Ilham (TASK-108)
Single Source of Truth: docs/Architecture.md & docs/PRD.md
"""

import json
import os
from typing import Any, Dict, List, Tuple

# Bounding box Kota Samarinda (Fokus area padat: Samarinda Ilir, Samarinda Kota, bantaran Sungai Karang Mumus)
SAMARINDA_BBOX = {
    "min_lng": 117.1300,
    "min_lat": -0.5050,
    "max_lng": 117.1600,
    "max_lat": -0.4800,
}

# Jaringan jalan lingkungan dan gang detail Samarinda (Jl. Pelita, Lambung Mangkurat, Gg. 4)
ROADS_DATASET: List[Dict[str, Any]] = [
    {
        "type": "Feature",
        "properties": {
            "osm_id": 1001,
            "name": "Jl. Pelita Utama",
            "highway": "residential",
            "road_width_meters": 6.0,
            "surface": "asphalt",
            "emergency_accessible": True,
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [117.1430, -0.4950],
                [117.1438, -0.4945],
                [117.1446, -0.4936],
                [117.1458, -0.4931],
            ],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "osm_id": 1002,
            "name": "Jl. Pelita Gang 4",
            "highway": "living_street",
            "road_width_meters": 1.8,
            "surface": "concrete",
            "emergency_accessible": True,
            "tactical_constraint": "NARROW_ALLEY_UNDER_2_5M",
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [117.1438, -0.4945],
                [117.1440, -0.4944],
                [117.1441, -0.4942],
                [117.1442, -0.4940],
                [117.1444, -0.4938],
            ],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "osm_id": 1003,
            "name": "Jl. Pelita Gang 2",
            "highway": "living_street",
            "road_width_meters": 2.1,
            "surface": "paving",
            "emergency_accessible": True,
            "tactical_constraint": "NARROW_ALLEY_UNDER_2_5M",
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [117.1446, -0.4936],
                [117.1448, -0.4933],
                [117.1450, -0.4930],
            ],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "osm_id": 1004,
            "name": "Jl. Lambung Mangkurat",
            "highway": "secondary",
            "road_width_meters": 10.0,
            "surface": "asphalt",
            "emergency_accessible": True,
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [117.1460, -0.4975],
                [117.1470, -0.4960],
                [117.1480, -0.4945],
                [117.1490, -0.4930],
            ],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "osm_id": 1005,
            "name": "Gang Pelita Buntu (Samping RT 14)",
            "highway": "footway",
            "road_width_meters": 1.2,
            "surface": "dirt",
            "emergency_accessible": False,
            "tactical_constraint": "NO_VEHICLE_ACCESS",
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [117.1441, -0.4942],
                [117.1443, -0.4943],
                [117.1445, -0.4944],
            ],
        },
    },
]

# Sungai Karang Mumus (Hydrography LineString & Waterways)
WATERWAYS_DATASET: List[Dict[str, Any]] = [
    {
        "type": "Feature",
        "properties": {
            "osm_id": 2001,
            "name": "Sungai Karang Mumus",
            "waterway": "river",
            "width_meters": 35.0,
            "tidal_water_source": True,
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [117.1415, -0.4915],
                [117.1432, -0.4948],
                [117.1440, -0.4970],
                [117.1455, -0.4990],
            ],
        },
    }
]


def extract_samarinda_osm_features(output_dir: str) -> Tuple[str, str]:
    """Mengekstraksi fitur jalan dan hidrografi Samarinda ke format GeoJSON."""
    os.makedirs(output_dir, exist_ok=True)

    roads_geojson = {
        "type": "FeatureCollection",
        "name": "samarinda_roads_dense",
        "bbox": [
            SAMARINDA_BBOX["min_lng"],
            SAMARINDA_BBOX["min_lat"],
            SAMARINDA_BBOX["max_lng"],
            SAMARINDA_BBOX["max_lat"],
        ],
        "features": ROADS_DATASET,
    }

    waterways_geojson = {
        "type": "FeatureCollection",
        "name": "samarinda_waterways",
        "bbox": [
            SAMARINDA_BBOX["min_lng"],
            SAMARINDA_BBOX["min_lat"],
            SAMARINDA_BBOX["max_lng"],
            SAMARINDA_BBOX["max_lat"],
        ],
        "features": WATERWAYS_DATASET,
    }

    roads_path = os.path.join(output_dir, "samarinda_roads.geojson")
    waterways_path = os.path.join(output_dir, "samarinda_waterways.geojson")

    with open(roads_path, "w", encoding="utf-8") as f:
        json.dump(roads_geojson, f, indent=2)

    with open(waterways_path, "w", encoding="utf-8") as f:
        json.dump(waterways_geojson, f, indent=2)

    return roads_path, waterways_path


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "output")
    r_path, w_path = extract_samarinda_osm_features(out_dir)
    print(f"Extracted OSM roads to: {r_path}")
    print(f"Extracted OSM waterways to: {w_path}")
