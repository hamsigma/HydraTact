"""Unit tests untuk sinkronisasi batch outbox dan resolusi konflik Last-Write-Wins (LWW).

File: apps/backend-api/tests/test_outbox_sync.py
PIC: @Ilham (TASK-206)
"""

import os
import sys
import unittest
from datetime import datetime, timezone, timedelta
from uuid import uuid4

backend_api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_api_dir not in sys.path:
    sys.path.insert(0, backend_api_dir)

from fastapi.testclient import TestClient
from main import app
from app.schemas.outbox import MutationSyncStatus


class TestOutboxSyncLWW(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_outbox_batch_sync_lww(self):
        """Menguji pemrosesan batch mutasi Isar outbox dengan aturan Last-Write-Wins."""
        source_id = str(uuid4())
        time_base = datetime(2026, 11, 13, 20, 10, 0, tzinfo=timezone.utc)

        # Mutasi 1: Regu B menandai READY pukul 20:12 (lebih baru)
        uuid_1 = str(uuid4())
        time_newer = time_base + timedelta(minutes=2)

        batch_1 = {
            "device_id": "android-regu-b",
            "unit_identifier": "FDR-02",
            "mutations": [
                {
                    "mutation_uuid": uuid_1,
                    "operation": "UPDATE_WATER_STATUS",
                    "target_id": source_id,
                    "client_timestamp": time_newer.isoformat(),
                    "payload": {"status": "READY", "pressure_bar": 5.0},
                }
            ],
        }

        resp_1 = self.client.post("/api/v1/sync/outbox-batch", json=batch_1)
        self.assertEqual(resp_1.status_code, 200)
        data_1 = resp_1.json()["data"]
        self.assertEqual(data_1["batch_processed_count"], 1)
        self.assertEqual(data_1["results"][0]["sync_status"], MutationSyncStatus.APPLIED.value)

        # Mutasi 2: Regu A menandai EMPTY pukul 20:10 (lebih lama, terlambat sync akibat blank spot)
        uuid_2 = str(uuid4())
        time_older = time_base  # 20:10:00

        batch_2 = {
            "device_id": "android-regu-a",
            "unit_identifier": "ATK-04",
            "mutations": [
                {
                    "mutation_uuid": uuid_2,
                    "operation": "UPDATE_WATER_STATUS",
                    "target_id": source_id,
                    "client_timestamp": time_base.isoformat(),
                    "payload": {"status": "EMPTY", "pressure_bar": 0.0},
                }
            ],
        }

        resp_2 = self.client.post("/api/v1/sync/outbox-batch", json=batch_2)
        self.assertEqual(resp_2.status_code, 200)
        data_2 = resp_2.json()["data"]
        self.assertEqual(data_2["batch_processed_count"], 1)
        # Sesuai LWW: Mutasi yang lebih usang diabaikan agar fakta lapangan terbaru dipertahankan!
        self.assertEqual(data_2["results"][0]["sync_status"], MutationSyncStatus.STALE_IGNORED.value)

    def test_outbox_idempotency(self):
        """Menguji bahwa mutasi dengan UUID yang sama tidak diproses berulang."""
        uuid_same = str(uuid4())
        batch = {
            "device_id": "android-unit-atk04",
            "unit_identifier": "ATK-04",
            "mutations": [
                {
                    "mutation_uuid": uuid_same,
                    "operation": "DEACTIVATE_BARRICADE",
                    "target_id": str(uuid4()),
                    "client_timestamp": datetime.now(timezone.utc).isoformat(),
                    "payload": {},
                }
            ],
        }

        resp_first = self.client.post("/api/v1/sync/outbox-batch", json=batch)
        self.assertEqual(resp_first.status_code, 200)
        self.assertEqual(resp_first.json()["data"]["results"][0]["sync_status"], MutationSyncStatus.APPLIED.value)

        # Kirim ulang payload yang sama (simulasi retry setelah koneksi putus)
        resp_retry = self.client.post("/api/v1/sync/outbox-batch", json=batch)
        self.assertEqual(resp_retry.status_code, 200)
        self.assertEqual(resp_retry.json()["data"]["results"][0]["sync_status"], MutationSyncStatus.STALE_IGNORED.value)


if __name__ == "__main__":
    unittest.main()
