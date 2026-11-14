"""Unit tests untuk endpoint FastAPI transisi Incident Lifecycle FSM dan Manual Override.

File: apps/backend-api/tests/test_incident_fsm.py
PIC: @Hervino (TASK-204)
"""

import os
import sys
import unittest
from uuid import UUID, uuid4

backend_api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_api_dir not in sys.path:
    sys.path.insert(0, backend_api_dir)

spatial_core_py = os.path.abspath(os.path.join(backend_api_dir, "../../packages/spatial-core/python"))
if spatial_core_py not in sys.path:
    sys.path.insert(0, spatial_core_py)

from fastapi.testclient import TestClient
from main import app
from app.repositories.incident_fsm import SIMULATED_INCIDENTS_CACHE
from app.schemas.common import IncidentFSMStatus


class TestIncidentFSMAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.test_incident_id = UUID("33333333-3333-3333-3333-333333333301")
        # Reset kondisi awal insiden simulasi
        SIMULATED_INCIDENTS_CACHE[self.test_incident_id] = {
            "id": self.test_incident_id,
            "incident_code": "HT-2026-089",
            "street_address": "Jl. Pelita Gg. 4 RT 14, Kel. Pelita, Kec. Samarinda Ilir",
            "road_width_meters": 1.80,
            "status": IncidentFSMStatus.PENDING_VERIFICATION,
            "verified_at": None,
            "closed_at": None,
        }

    def test_fsm_sequential_transitions_and_dispatch_protocol(self):
        """Menguji transisi status sekuensial sah dari PENDING_VERIFICATION hingga ARCHIVED."""
        # 1. PENDING_VERIFICATION -> VERIFIED
        r1 = self.client.patch(
            f"/api/v1/incidents/{self.test_incident_id}/transition",
            json={"target_status": "VERIFIED"},
        )
        self.assertEqual(r1.status_code, 200, r1.text)
        d1 = r1.json()["data"]
        self.assertEqual(d1["previous_status"], "PENDING_VERIFICATION")
        self.assertEqual(d1["current_status"], "VERIFIED")

        # 2. VERIFIED -> DISPATCHING (dengan auto-split lorong sempit 1.8m)
        r2 = self.client.patch(
            f"/api/v1/incidents/{self.test_incident_id}/transition",
            json={"target_status": "DISPATCHING"},
        )
        self.assertEqual(r2.status_code, 200, r2.text)
        d2 = r2.json()["data"]
        self.assertEqual(d2["current_status"], "DISPATCHING")
        self.assertEqual(d2["dispatch_protocol"], "AUTO_SPLIT_NARROW_ALLEY")

        # 3. DISPATCHING -> SUPPRESSION_ACTIVE
        r3 = self.client.patch(
            f"/api/v1/incidents/{self.test_incident_id}/transition",
            json={"target_status": "SUPPRESSION_ACTIVE"},
        )
        self.assertEqual(r3.status_code, 200, r3.text)
        self.assertEqual(r3.json()["data"]["current_status"], "SUPPRESSION_ACTIVE")

        # 4. SUPPRESSION_ACTIVE -> OVERHAUL_COOLING
        r4 = self.client.patch(
            f"/api/v1/incidents/{self.test_incident_id}/transition",
            json={"target_status": "OVERHAUL_COOLING"},
        )
        self.assertEqual(r4.status_code, 200, r4.text)
        self.assertEqual(r4.json()["data"]["current_status"], "OVERHAUL_COOLING")

        # 5. OVERHAUL_COOLING -> INCIDENT_CLOSED
        r5 = self.client.patch(
            f"/api/v1/incidents/{self.test_incident_id}/transition",
            json={"target_status": "INCIDENT_CLOSED"},
        )
        self.assertEqual(r5.status_code, 200, r5.text)
        self.assertEqual(r5.json()["data"]["current_status"], "INCIDENT_CLOSED")

        # 6. INCIDENT_CLOSED -> ARCHIVED
        r6 = self.client.patch(
            f"/api/v1/incidents/{self.test_incident_id}/transition",
            json={"target_status": "ARCHIVED"},
        )
        self.assertEqual(r6.status_code, 200, r6.text)
        self.assertEqual(r6.json()["data"]["current_status"], "ARCHIVED")

    def test_invalid_transition_returns_409_conflict(self):
        """Memastikan percobaan transisi ilegal ditolak dengan HTTP 409 Conflict."""
        # Percobaan lompat dari PENDING_VERIFICATION langsung ke INCIDENT_CLOSED
        resp = self.client.patch(
            f"/api/v1/incidents/{self.test_incident_id}/transition",
            json={"target_status": "INCIDENT_CLOSED"},
        )
        self.assertEqual(resp.status_code, 409)
        err = resp.json()["error"]
        self.assertEqual(err["code"], "INVALID_FSM_TRANSITION")
        self.assertIn("tidak diizinkan", err["message"])

    def test_manual_override_endpoint(self):
        """Menguji tombol Manual Override oleh posko pada laporan pelapor tunggal dini hari."""
        resp = self.client.post(
            f"/api/v1/incidents/{self.test_incident_id}/override",
            json={
                "target_status": "VERIFIED",
                "override_reason": "Verifikasi darurat via radio HT Balakarcana Jl. Pelita, pelapor tunggal sah.",
                "road_width_meters": 1.80,
                "operator_notes": "Api melalap rumah warga di gang 4, luncurkan regu tossa attacker",
            },
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()["data"]
        self.assertEqual(data["previous_status"], "PENDING_VERIFICATION")
        self.assertEqual(data["current_status"], "VERIFIED")

    def test_entity_not_found(self):
        """Memastikan penanganan insiden yang tidak ada mengembalikan 404."""
        random_id = str(uuid4())
        resp = self.client.patch(
            f"/api/v1/incidents/{random_id}/transition",
            json={"target_status": "VERIFIED"},
        )
        self.assertEqual(resp.status_code, 404)
        err = resp.json()["error"]
        self.assertEqual(err["code"], "INSIDEN_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
