"""
Unit test untuk endpoint ekspor data insiden taktis (GeoJSON & KML).
"""

import unittest
from fastapi.testclient import TestClient

from main import app


class TestIncidentExport(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.incident_id = "33333333-3333-3333-3333-333333333301"

    def test_export_incident_geojson(self):
        """Memastikan ekspor GeoJSON menghasilkan FeatureCollection yang valid."""
        response = self.client.get(f"/api/v1/incidents/{self.incident_id}/export/geojson")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["type"], "FeatureCollection")
        self.assertIn("features", data)
        self.assertTrue(len(data["features"]) >= 1)

        # Validasi feature titik api
        epicenter_feat = data["features"][0]
        self.assertEqual(epicenter_feat["type"], "Feature")
        self.assertEqual(epicenter_feat["geometry"]["type"], "Point")
        self.assertEqual(epicenter_feat["properties"]["entity"], "INCIDENT_EPICENTER")
        self.assertEqual(epicenter_feat["properties"]["incident_code"], "HT-2026-089")

        # Validasi feature responding unit jika ada
        if len(data["features"]) > 1:
            unit_feat = data["features"][1]
            self.assertEqual(unit_feat["properties"]["entity"], "RESPONDING_UNIT")
            self.assertIn(unit_feat["properties"]["role"], ("ATTACKER", "FEEDER"))

    def test_export_incident_kml(self):
        """Memastikan ekspor KML menghasilkan dokumen XML yang valid dengan header attachment."""
        response = self.client.get(f"/api/v1/incidents/{self.incident_id}/export/kml")
        self.assertEqual(response.status_code, 200)
        self.assertIn("application/vnd.google-earth.kml+xml", response.headers.get("content-type", ""))
        self.assertIn("attachment", response.headers.get("content-disposition", ""))
        text = response.text
        self.assertIn("<?xml version=", text)
        self.assertIn("<kml xmlns=", text)
        self.assertIn("HT-2026-089", text)
        self.assertIn("<Placemark>", text)

    def test_export_nonexistent_incident_returns_404(self):
        """Memastikan ID insiden yang tidak ada mengembalikan 404."""
        dummy_id = "00000000-0000-0000-0000-000000000000"
        response = self.client.get(f"/api/v1/incidents/{dummy_id}/export/geojson")
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
