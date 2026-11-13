"""Unit tests untuk kueri spasial PostGIS dan konsensus geofencing.

File: apps/backend-api/tests/test_spatial_queries.py
PIC: @Ilham (TASK-107)
"""

import os
import sys
import unittest
from datetime import datetime, timezone
from uuid import UUID

# Tambahkan direktori apps/backend-api ke sys.path
backend_api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_api_dir not in sys.path:
    sys.path.insert(0, backend_api_dir)

from fastapi.testclient import TestClient
from main import app
from app.repositories.spatial import (
    haversine_distance_meters,
    calculate_estimated_travel_minutes,
    query_nearest_water_sources,
    update_water_source_status_in_db,
    process_citizen_incident_report,
)
from app.schemas.common import WaterSourceStatus, WaterSourceType, GeoPoint, IncidentFSMStatus
from app.schemas.incident import CitizenReportRequest
from app.schemas.water import WaterStatusUpdateRequest


class TestSpatialQueriesAndConsensus(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_haversine_distance_calculation(self):
        """Menguji akurasi rumus Haversine antara dua titik koordinat di Samarinda."""
        # Titik 1: Mulut Jl. Pelita Gg. 4 (-0.4945, 117.1438)
        # Titik 2: Episentrum Simulasi RT 14 (-0.4942, 117.1441)
        dist = haversine_distance_meters(-0.4945, 117.1438, -0.4942, 117.1441)
        # Jarak nyata sekitar 45-50 meter
        self.assertTrue(40.0 <= dist <= 60.0)

    def test_calculate_estimated_travel_minutes(self):
        """Menguji estimasi waktu tempuh armada pada manuver gang sempit."""
        eta = calculate_estimated_travel_minutes(700.0, avg_speed_kmh=21.0)
        # 700m pada 350m/menit = 2 menit + 1 menit persiapan = 3.0 menit
        self.assertEqual(eta, 3.0)

    def test_api_nearest_water_sources(self):
        """Menguji endpoint GET /api/v1/water-sources/nearest."""
        response = self.client.get(
            "/api/v1/water-sources/nearest",
            params={
                "lat": -0.4945,
                "lng": 117.1438,
                "limit": 3,
                "include_low_discharge": True,
            },
        )
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["status"], "success")
        data = json_data["data"]
        self.assertEqual(len(data), 3)

        # Pastikan data terurut berdasarkan jarak terdekat
        distances = [item["distance_meters"] for item in data]
        self.assertEqual(distances, sorted(distances))

        # Titik terdekat di mulut gang 4 harus berada dalam jarak < 20 meter dari dirinya sendiri
        self.assertTrue(distances[0] < 20.0)
        self.assertEqual(data[0]["code"], "HYD-PLT-02")

    def test_api_update_water_source_status(self):
        """Menguji endpoint PATCH /api/v1/water-sources/{source_id}/status."""
        source_id = "22222222-2222-2222-2222-222222222201"
        response = self.client.patch(
            f"/api/v1/water-sources/{source_id}/status",
            json={
                "status": "LOW_DISCHARGE",
                "pressure_bar": 2.5,
                "reported_by_unit": "ATK-04",
                "notes": "Debit air menurun akibat pemakaian bersama",
            },
        )
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["status"], "success")
        self.assertEqual(json_data["data"]["status"], "LOW_DISCHARGE")
        self.assertEqual(json_data["data"]["pressure_bar"], 2.5)

    def test_api_report_incident_and_consensus(self):
        """Menguji endpoint POST /api/v1/incidents/report dengan evaluasi konsensus radius 100m."""
        # Laporan darurat di koordinat simulasi Jl. Pelita Gg. 4
        response = self.client.post(
            "/api/v1/incidents/report",
            json={
                "reporter_phone": "+6281343408542",
                "location": {
                    "type": "Point",
                    "coordinates": [117.1441, -0.4942],
                },
                "gps_accuracy_meters": 4.2,
                "haptic_hold_duration_ms": 2100,
                "client_timestamp": "2026-11-13T19:45:00Z",
            },
        )
        self.assertEqual(response.status_code, 201)
        json_data = response.json()
        self.assertEqual(json_data["status"], "success")
        incident_data = json_data["data"]
        self.assertTrue(incident_data["consensus"]["is_verified"])
        self.assertEqual(incident_data["consensus"]["cluster_radius_meters"], 100.0)
        self.assertIn(incident_data["incident_status"], ("VERIFIED", "SUPPRESSION_ACTIVE"))

    def test_api_get_incident_detail(self):
        """Menguji endpoint GET /api/v1/incidents/{id}."""
        incident_id = "33333333-3333-3333-3333-333333333301"
        response = self.client.get(f"/api/v1/incidents/{incident_id}")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["status"], "success")
        detail = json_data["data"]
        self.assertEqual(detail["incident_code"], "HT-2026-089")
        self.assertEqual(detail["road_width_meters"], 1.80)
        self.assertEqual(len(detail["allocated_units"]), 2)
        roles = [u["assigned_role"] for u in detail["allocated_units"]]
        self.assertIn("ATTACKER", roles)
        self.assertIn("FEEDER", roles)


if __name__ == "__main__":
    unittest.main()
