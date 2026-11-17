"""
Unit test untuk Prometheus Metrics dan System Health Probes.
Memastikan GET /metrics mengembalikan format text/plain yang valid dan probe Kubernetes berfungsi.
"""

import unittest
from fastapi.testclient import TestClient

from main import app
from app.core.metrics import (
    generate_prometheus_metrics_text,
    increment_consensus_evaluated,
    increment_outbox_synced,
    record_request_metric,
)


class TestMetricsAndHealth(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        """Memastikan endpoint /health mengembalikan status operasional."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertIn("status", json_data)
        self.assertIn("database", json_data)
        self.assertIn("spatial_engine", json_data)

    def test_liveness_and_readiness_probes(self):
        """Memastikan endpoint /health/liveness dan /health/readiness aktif."""
        live_res = self.client.get("/health/liveness")
        self.assertEqual(live_res.status_code, 200)
        self.assertEqual(live_res.json()["status"], "alive")

        ready_res = self.client.get("/health/readiness")
        self.assertEqual(ready_res.status_code, 200)
        self.assertEqual(ready_res.json()["status"], "ready")

    def test_prometheus_metrics_endpoint(self):
        """Memastikan endpoint /metrics mengembalikan teks format Prometheus."""
        # Lakukan pemanggilan agar middleware merekam metrik
        self.client.get("/")
        increment_consensus_evaluated()
        increment_outbox_synced(5)

        response = self.client.get("/metrics")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/plain", response.headers.get("content-type", ""))
        body = response.text
        self.assertIn("hydratact_http_requests_total", body)
        self.assertIn("hydratact_consensus_evaluations_total", body)
        self.assertIn("hydratact_outbox_mutations_synced_total", body)
        self.assertIn("hydratact_system_up 1", body)


if __name__ == "__main__":
    unittest.main()
