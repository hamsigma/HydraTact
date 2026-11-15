"""Unit tests untuk proteksi rate limiting dan anti-abuse pada endpoint pelaporan warga.

File: apps/backend-api/tests/test_rate_limit.py
PIC: @Hervino (TASK-208)
"""

import os
import sys
import unittest
from datetime import datetime, timezone

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
from app.core.limiter import limiter


class TestRateLimiting(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Reset storage limiter sebelum setiap test
        limiter.reset()
        self.transport = httpx.ASGITransport(app=app)
        self.client = httpx.AsyncClient(
            transport=self.transport,
            base_url="http://test",
            headers={"X-Forwarded-For": "192.168.1.100"},
        )

    async def asyncTearDown(self):
        await self.client.aclose()
        limiter.reset()

    async def test_incident_report_rate_limit_enforcement(self):
        """Memverifikasi bahwa kuota pelaporan darurat dibatasi maksimal 3 permintaan/menit per IP.
        
        Permintaan 1-3 harus berhasil (201 Created).
        Permintaan ke-4 harus ditolak dengan HTTP 429 Too Many Requests dan pesan RFC 7807 terstruktur.
        """
        payload = {
            "reporter_phone": "+6281234567890",
            "location": {
                "type": "Point",
                "coordinates": [117.1536, -0.5021],  # [lon, lat] Samarinda
            },
            "gps_accuracy_meters": 4.5,
            "haptic_hold_duration_ms": 2500,
            "client_timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Request 1
        resp1 = await self.client.post("/api/v1/incidents/report", json=payload)
        self.assertEqual(resp1.status_code, 201, f"Req 1 failed: {resp1.text}")
        data1 = resp1.json()
        self.assertEqual(data1["status"], "success")

        # Request 2
        resp2 = await self.client.post("/api/v1/incidents/report", json=payload)
        self.assertEqual(resp2.status_code, 201, f"Req 2 failed: {resp2.text}")

        # Request 3
        resp3 = await self.client.post("/api/v1/incidents/report", json=payload)
        self.assertEqual(resp3.status_code, 201, f"Req 3 failed: {resp3.text}")

        # Request 4 (HARUS DITOLAK: 429 Too Many Requests)
        resp4 = await self.client.post("/api/v1/incidents/report", json=payload)
        self.assertEqual(
            resp4.status_code,
            429,
            f"Expected HTTP 429 on 4th request, got {resp4.status_code}: {resp4.text}",
        )
        data4 = resp4.json()
        self.assertEqual(data4["status"], "error")
        self.assertEqual(data4["error"]["code"], "RATE_LIMIT_EXCEEDED")
        self.assertIn("Terlalu banyak permintaan pelaporan darurat", data4["error"]["message"])
        self.assertEqual(data4["error"]["details"]["retry_after_seconds"], 60)
        self.assertIn("Retry-After", resp4.headers)
        self.assertEqual(resp4.headers["Retry-After"], "60")


if __name__ == "__main__":
    unittest.main()
