"""Unit tests untuk endpoint aksi taktis backend, barikade jalan, dan penugasan peran unit.

File: apps/backend-api/tests/test_action_endpoints.py
PIC: @Hervino (TASK-205 Remediation)
"""

import os
import sys
import unittest
from datetime import datetime, timezone
from uuid import uuid4

backend_api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_api_dir not in sys.path:
    sys.path.insert(0, backend_api_dir)

spatial_core_dir = os.path.abspath(
    os.path.join(backend_api_dir, "..", "..", "packages", "spatial-core", "python")
)
if spatial_core_dir not in sys.path:
    sys.path.insert(0, spatial_core_dir)

import httpx
from main import app
from app.schemas.common import TacticalRole


class TestActionEndpoints(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.transport = httpx.ASGITransport(app=app)
        self.client = httpx.AsyncClient(transport=self.transport, base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()

    async def test_barricade_lifecycle(self):
        """Menguji pendaftaran, pemanggilan daftar, dan penonaktifan barikade ruas jalan."""
        incident_id = str(uuid4())
        create_payload = {
            "incident_id": incident_id,
            "road_name": "Mulut Jl. Pelita Gg. 4",
            "reason": "HOSE_CONNECTED",
            "hose_length_meters": 110,
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [117.1428, -0.4952],
                    [117.1435, -0.4947],
                    [117.1443, -0.4938],
                ],
            },
        }

        # 1. POST create barricade
        create_resp = await self.client.post("/api/v1/barricades", json=create_payload)
        if create_resp.status_code != 201:
            print("Barricade error:", create_resp.json())
        self.assertEqual(create_resp.status_code, 201)
        data = create_resp.json()["data"]
        barricade_id = data["barricade_id"]
        self.assertEqual(data["road_name"], "Mulut Jl. Pelita Gg. 4")
        self.assertTrue(data["is_active"])

        # 2. GET list active barricades
        list_resp = await self.client.get("/api/v1/barricades")
        self.assertEqual(list_resp.status_code, 200)
        barricades = list_resp.json()["data"]
        self.assertTrue(any(b["barricade_id"] == barricade_id for b in barricades))

        # 3. PATCH deactivate barricade
        deactivate_resp = await self.client.patch(f"/api/v1/barricades/{barricade_id}/deactivate")
        self.assertEqual(deactivate_resp.status_code, 200)
        deact_data = deactivate_resp.json()["data"]
        self.assertFalse(deact_data["is_active"])

    async def test_unit_assign_dynamic_role_dispatch(self):
        """Menguji penugasan armada dengan kalkulasi peran otomatis ATTACKER vs FEEDER."""
        incident_id = "33333333-3333-3333-3333-333333333301"

        # Kasus A: Unit tangki besar (5.000 L) dialokasikan sebagai FEEDER di jalan sempit (< 2.5m)
        feeder_payload = {
            "unit_identifier": "FDR-01",
            "posko_name": "Balakarcana Posko 02",
            "vehicle_type": "LARGE_TANK",
            "water_capacity_liters": 5000,
            "current_location": {"type": "Point", "coordinates": [117.1428, -0.4952]},
        }
        resp_feeder = await self.client.post(
            f"/api/v1/incidents/{incident_id}/units/assign",
            json=feeder_payload,
        )
        if resp_feeder.status_code != 200:
            print("Assign error:", resp_feeder.json())
        self.assertEqual(resp_feeder.status_code, 200)
        data_feeder = resp_feeder.json()["data"]
        self.assertEqual(data_feeder["assigned_role"], TacticalRole.FEEDER.value)
        self.assertIn("FEEDER", data_feeder["dispatch_rationale"])

        # Kasus B: Unit tangki kecil (800 L) dialokasikan sebagai ATTACKER di jalan sempit (< 2.5m)
        attacker_payload = {
            "unit_identifier": "ATK-01",
            "posko_name": "Balakarcana Posko 02",
            "vehicle_type": "THREE_WHEELER",
            "water_capacity_liters": 800,
            "current_location": {"type": "Point", "coordinates": [117.1441, -0.4942]},
        }
        resp_attacker = await self.client.post(
            f"/api/v1/incidents/{incident_id}/units/assign",
            json=attacker_payload,
        )
        self.assertEqual(resp_attacker.status_code, 200)
        data_attacker = resp_attacker.json()["data"]
        self.assertEqual(data_attacker["assigned_role"], TacticalRole.ATTACKER.value)
        self.assertIn("ATTACKER", data_attacker["dispatch_rationale"])

    async def test_water_pressure_request_and_telemetry(self):
        """Menguji pengiriman sinyal permintaan tekanan pompa dan telemetri unit."""
        from_unit_id = str(uuid4())
        to_unit_id = str(uuid4())

        pressure_payload = {
            "target_bar": 5.0,
            "to_unit_id": to_unit_id,
            "notes": "Minta suplai 5.0 Bar untuk nozzle serbu Jl. Pelita Gg. 4",
        }
        resp_pressure = await self.client.post(
            f"/api/v1/units/{from_unit_id}/pressure-request",
            json=pressure_payload,
        )
        self.assertEqual(resp_pressure.status_code, 200)
        pressure_data = resp_pressure.json()["data"]
        self.assertEqual(pressure_data["target_bar"], 5.0)
        self.assertEqual(pressure_data["to_unit_id"], to_unit_id)

        # Telemetri unit
        telemetry_payload = {
            "coordinates": {"type": "Point", "coordinates": [117.1441, -0.4942]},
            "pump_active": True,
            "water_remaining_liters": 650,
        }
        resp_telemetry = await self.client.post(
            f"/api/v1/units/{from_unit_id}/telemetry",
            json=telemetry_payload,
        )
        self.assertEqual(resp_telemetry.status_code, 200)
        self.assertEqual(resp_telemetry.json()["status"], "success")

    async def test_outbox_create_barricade_batch_sync(self):
        """Menguji bahwa mutasi CREATE_BARRICADE pada outbox batch diproses sukses."""
        barricade_id = str(uuid4())
        mutation_uuid = str(uuid4())
        batch = {
            "device_id": "android-unit-fdr01",
            "unit_identifier": "FDR-01",
            "mutations": [
                {
                    "mutation_uuid": mutation_uuid,
                    "operation": "CREATE_BARRICADE",
                    "target_id": barricade_id,
                    "client_timestamp": datetime.now(timezone.utc).isoformat(),
                    "payload": {
                        "road_name": "Mulut Jl. Pelita Gg. 4",
                        "hose_length_meters": 110,
                        "reason": "PRESSURIZED_HOSE_LINE",
                    },
                }
            ],
        }
        resp = await self.client.post("/api/v1/sync/outbox-batch", json=batch)
        self.assertEqual(resp.status_code, 200)
        res_item = resp.json()["data"]["results"][0]
        self.assertEqual(res_item["sync_status"], "APPLIED")


if __name__ == "__main__":
    unittest.main()
