"""Pengujian Integrasi Alur Penuh E2E Skenario Kebakaran Jl. Pelita Gg. 4 (TASK-408).

Menghubungkan seluruh rantai koordinasi taktis:
1. Pelaporan darurat warga (Citizen PWA 1-Tap SOS)
2. Evaluasi konsensus spasial anti-prank radius 100m dan selang waktu 3 menit
3. Deteksi lebar gang Jl. Pelita Gg. 4 (2.1m) dan alokasi peran Auto-Split (ATTACKER vs FEEDER)
4. Bentangan barikade selang jalan fuchsia oleh unit Feeder (110 meter)
5. Permintaan tekanan air nozzle oleh unit Attacker (5.0 bar)
6. Transisi status operasional FSM hingga api berhasil dikuasai dan dipadamkan

File: tests/e2e/test_pelita_gg4_scenario.py
PIC: @Hervino (TASK-408)
"""

import os
import sys
import time
import unittest
from datetime import datetime, timezone
from uuid import uuid4

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
backend_api_dir = os.path.join(repo_root, "apps", "backend-api")
spatial_core_dir = os.path.join(repo_root, "packages", "spatial-core", "python")

if backend_api_dir not in sys.path:
    sys.path.insert(0, backend_api_dir)
if spatial_core_dir not in sys.path:
    sys.path.insert(0, spatial_core_dir)

import httpx
from main import app
from spatial_core import determine_tactical_role
from app.schemas.common import IncidentFSMStatus, TacticalRole, VehicleType
from app.repositories.spatial import reset_in_memory_spatial_state
from app.core.limiter import limiter


class TestPelitaGg4E2EFlow(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        reset_in_memory_spatial_state()
        limiter.reset()
        self.transport = httpx.ASGITransport(app=app)
        self.client = httpx.AsyncClient(transport=self.transport, base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        reset_in_memory_spatial_state()
        limiter.reset()

    async def test_full_incident_lifecycle_pelita_gg4(self):
        """Memverifikasi skenario taktis lengkap Jl. Pelita Gg. 4 dari SOS warga hingga insiden selesai."""
        start_time = time.perf_counter()

        # ---------------------------------------------------------------------
        # LANGKAH 1: Laporan Pertama Warga di Jl. Pelita Gg. 4
        # ---------------------------------------------------------------------
        pelita_gg4_coords = [117.1536, -0.5021]  # [lon, lat]
        report_payload_1 = {
            "reporter_phone": "+6281343408542",
            "location": {
                "type": "Point",
                "coordinates": pelita_gg4_coords,
            },
            "gps_accuracy_meters": 4.2,
            "haptic_hold_duration_ms": 2050,
            "client_timestamp": datetime.now(timezone.utc).isoformat(),
        }

        resp1 = await self.client.post("/api/v1/incidents/report", json=report_payload_1)
        self.assertEqual(resp1.status_code, 201, f"Laporan warga 1 gagal: {resp1.text}")
        data1 = resp1.json()["data"]
        incident_id = data1["incident_id"]
        self.assertIsNotNone(incident_id)
        # Laporan pertama belum mencapai kuorum konsensus (1 dari 2 pelapor)
        self.assertFalse(data1["consensus"]["is_verified"])
        self.assertEqual(data1["consensus"]["unique_reporters_count"], 1)

        # ---------------------------------------------------------------------
        # LANGKAH 2: Laporan Kedua Warga Terdekat (Radius 35m) Memicu Konsensus
        # ---------------------------------------------------------------------
        report_payload_2 = {
            "reporter_phone": "+6281155998811",
            "location": {
                "type": "Point",
                "coordinates": [117.1538, -0.5023],  # Selisih ~30 meter dari pelapor 1
            },
            "gps_accuracy_meters": 3.8,
            "haptic_hold_duration_ms": 2100,
            "client_timestamp": datetime.now(timezone.utc).isoformat(),
        }

        resp2 = await self.client.post("/api/v1/incidents/report", json=report_payload_2)
        self.assertEqual(resp2.status_code, 201, f"Laporan warga 2 gagal: {resp2.text}")
        data2 = resp2.json()["data"]

        # Verifikasi konsensus otomatis tercapai (< 2 detik waktu respon)
        elapsed_latency_ms = (time.perf_counter() - start_time) * 1000
        self.assertLess(
            elapsed_latency_ms,
            2000.0,
            f"Waktu tanggap sistem ({elapsed_latency_ms:.2f}ms) melebihi batas 2.0 detik",
        )
        self.assertTrue(data2["consensus"]["is_verified"], "Konsensus spasial harus terverifikasi otomatis")
        self.assertGreaterEqual(data2["consensus"]["unique_reporters_count"], 2)

        # ---------------------------------------------------------------------
        # LANGKAH 3: Evaluasi Auto-Split Berdasarkan Lebar Gang Jl. Pelita Gg. 4 (2.1m)
        # ---------------------------------------------------------------------
        gang_width_meters = 2.1
        # Unit kecil (Balakarcana 01, tangki 800L) -> ATTACKER
        role_unit_1 = determine_tactical_role(gang_width_meters, 800)
        self.assertEqual(role_unit_1, "ATTACKER")

        # Unit besar (Tangki Induk 05, tangki 5000L) -> FEEDER
        role_unit_5 = determine_tactical_role(gang_width_meters, 5000)
        self.assertEqual(role_unit_5, "FEEDER")

        # Daftarkan penugasan kedua unit ke insiden melalui endpoint API
        assign_resp1 = await self.client.post(
            f"/api/v1/incidents/{incident_id}/units/assign",
            json={
                "unit_identifier": "ATK-01",
                "posko_name": "Balakarcana Posko 02",
                "vehicle_type": VehicleType.THREE_WHEELER.value,
                "water_capacity_liters": 800,
                "current_location": {
                    "type": "Point",
                    "coordinates": pelita_gg4_coords,
                },
            },
        )
        self.assertEqual(assign_resp1.status_code, 200, f"Assign attacker failed: {assign_resp1.text}")
        self.assertEqual(assign_resp1.json()["data"]["assigned_role"], TacticalRole.ATTACKER.value)

        assign_resp5 = await self.client.post(
            f"/api/v1/incidents/{incident_id}/units/assign",
            json={
                "unit_identifier": "FDR-01",
                "posko_name": "Balakarcana Posko 02",
                "vehicle_type": VehicleType.LARGE_TANK.value,
                "water_capacity_liters": 5000,
                "current_location": {
                    "type": "Point",
                    "coordinates": [117.1530, -0.5018],
                },
            },
        )
        self.assertEqual(assign_resp5.status_code, 200, f"Assign feeder failed: {assign_resp5.text}")
        self.assertEqual(assign_resp5.json()["data"]["assigned_role"], TacticalRole.FEEDER.value)
        feeder_unit_id = assign_resp5.json()["data"]["unit_id"]

        # ---------------------------------------------------------------------
        # LANGKAH 4: Bentangan Barikade Selang Jalan oleh Unit Feeder (110m)
        # ---------------------------------------------------------------------
        barricade_resp = await self.client.post(
            "/api/v1/barricades",
            json={
                "incident_id": incident_id,
                "road_name": "Mulut Jl. Pelita Gg. 4",
                "reason": "HOSE_CONNECTED",
                "hose_length_meters": 110,
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [117.1530, -0.5018],
                        [117.1536, -0.5021],
                    ],
                },
            },
        )
        self.assertEqual(barricade_resp.status_code, 201)
        barricade_id = barricade_resp.json()["data"]["barricade_id"]
        self.assertTrue(barricade_resp.json()["data"]["is_active"])

        # ---------------------------------------------------------------------
        # LANGKAH 5: Permintaan Tekanan Air Nozzle oleh Unit Attacker (5.0 Bar)
        # ---------------------------------------------------------------------
        attacker_unit_id = str(uuid4())
        pressure_resp = await self.client.post(
            f"/api/v1/units/{attacker_unit_id}/pressure-request",
            json={
                "target_bar": 5.0,
                "to_unit_id": feeder_unit_id,
                "notes": "Tekanan optimal nozzle Jl. Pelita Gg. 4",
            },
        )
        self.assertEqual(pressure_resp.status_code, 200, f"Pressure req failed: {pressure_resp.text}")
        pressure_data = pressure_resp.json()["data"]
        self.assertEqual(pressure_data["target_bar"], 5.0)

        # ---------------------------------------------------------------------
        # LANGKAH 6: Siklus Transisi FSM Operasi hingga Api Padam Tuntas
        # ---------------------------------------------------------------------
        # VERIFIED -> DISPATCHING
        resp_disp = await self.client.patch(
            f"/api/v1/incidents/{incident_id}/transition",
            json={
                "target_status": IncidentFSMStatus.DISPATCHING.value,
                "operator_notes": "Armada Balakarcana meluncur ke lokasi",
            },
        )
        self.assertEqual(resp_disp.status_code, 200)
        self.assertEqual(resp_disp.json()["data"]["current_status"], IncidentFSMStatus.DISPATCHING.value)

        # DISPATCHING -> SUPPRESSION_ACTIVE
        resp_water = await self.client.patch(
            f"/api/v1/incidents/{incident_id}/transition",
            json={
                "target_status": IncidentFSMStatus.SUPPRESSION_ACTIVE.value,
                "operator_notes": "Penyemprotan nozzle aktif ke titik api",
            },
        )
        self.assertEqual(resp_water.status_code, 200)
        self.assertEqual(resp_water.json()["data"]["current_status"], IncidentFSMStatus.SUPPRESSION_ACTIVE.value)

        # SUPPRESSION_ACTIVE -> OVERHAUL_COOLING
        resp_ctrl = await self.client.patch(
            f"/api/v1/incidents/{incident_id}/transition",
            json={
                "target_status": IncidentFSMStatus.OVERHAUL_COOLING.value,
                "operator_notes": "Api utama padam, pendinginan bara berlangsung",
            },
        )
        self.assertEqual(resp_ctrl.status_code, 200)
        self.assertEqual(resp_ctrl.json()["data"]["current_status"], IncidentFSMStatus.OVERHAUL_COOLING.value)

        # OVERHAUL_COOLING -> INCIDENT_CLOSED
        resp_res = await self.client.patch(
            f"/api/v1/incidents/{incident_id}/transition",
            json={
                "target_status": IncidentFSMStatus.INCIDENT_CLOSED.value,
                "operator_notes": "Suhu dingin tercapai, seluruh unit kembali ke posko",
            },
        )
        self.assertEqual(resp_res.status_code, 200)
        self.assertEqual(resp_res.json()["data"]["current_status"], IncidentFSMStatus.INCIDENT_CLOSED.value)

        # ---------------------------------------------------------------------
        # LANGKAH 7: Pelepasan Barikade Selang Jalan Pasca-Pemadaman
        # ---------------------------------------------------------------------
        deact_resp = await self.client.patch(f"/api/v1/barricades/{barricade_id}/deactivate")
        self.assertEqual(deact_resp.status_code, 200)
        self.assertFalse(deact_resp.json()["data"]["is_active"])

        # ---------------------------------------------------------------------
        # LANGKAH 8: Verifikasi Detail Akhir Insiden
        # ---------------------------------------------------------------------
        detail_resp = await self.client.get(f"/api/v1/incidents/{incident_id}")
        self.assertEqual(detail_resp.status_code, 200)
        final_detail = detail_resp.json()["data"]
        self.assertEqual(final_detail["status"], IncidentFSMStatus.INCIDENT_CLOSED.value)


if __name__ == "__main__":
    unittest.main()
