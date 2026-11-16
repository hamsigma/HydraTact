"""Unit tests untuk Python spatial_core."""

import os
import sys
import unittest
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from spatial_core import (
    haversine_distance_meters,
    evaluate_geofencing_consensus,
    determine_tactical_role,
    evaluate_road_access_role,
    calculate_relay_hose_pressure,
    find_nearest_water_sources,
    evaluate_tidal_suction_viability,
    generate_hose_crossing_barricade,
)


class TestPythonSpatialCore(unittest.TestCase):
    def test_haversine(self):
        dist = haversine_distance_meters(-0.4945, 117.1438, -0.4942, 117.1441)
        self.assertTrue(40.0 <= dist <= 60.0)

    def test_geofencing_consensus_verified(self):
        now = datetime(2026, 11, 13, 20, 0, 0, tzinfo=timezone.utc)
        reports = [
            {
                "reporter_phone": "+6281343408542",
                "coordinates": (-0.4942, 117.1441),
                "timestamp": now - timedelta(seconds=60),
            },
            {
                "reporter_phone": "+6281298765431",
                "coordinates": (-0.4941, 117.1443),
                "timestamp": now - timedelta(seconds=90),
            },
        ]
        res = evaluate_geofencing_consensus(reports, -0.4942, 117.1441, now)
        self.assertTrue(res["is_verified"])
        self.assertEqual(res["unique_reporters_count"], 2)

    def test_geofencing_high_confidence_bypass(self):
        now = datetime(2026, 11, 13, 20, 0, 0, tzinfo=timezone.utc)
        single_with_photo = [
            {
                "reporter_phone": "+6281343408542",
                "coordinates": (-0.4942, 117.1441),
                "timestamp": now - timedelta(seconds=20),
                "gps_accuracy_meters": 10.0,
                "photo_hash": "a1b2c3d4e5f67890",
            }
        ]
        res = evaluate_geofencing_consensus(single_with_photo, -0.4942, 117.1441, now)
        self.assertTrue(res["is_verified"])
        self.assertTrue(res["is_high_confidence_bypass"])


    def test_dispatch_role_rules(self):
        self.assertEqual(determine_tactical_role(1.8, 5000), "FEEDER")
        self.assertEqual(determine_tactical_role(1.8, 600), "ATTACKER")
        self.assertEqual(determine_tactical_role(2.0, 1500), "RESERVE_FEEDER")
        self.assertEqual(determine_tactical_role(3.5, 5000), "DIRECT_ATTACK")

    def test_evaluate_road_access_role(self):
        feeder = evaluate_road_access_role(1.8, 5000, (117.1628, -0.4848), (117.1639, -0.4839))
        self.assertEqual(feeder["assigned_role"], "FEEDER")
        self.assertEqual(feeder["arterial_staging_point"], (117.1639, -0.4839))
        self.assertEqual(feeder["attack_entry_point"], (117.1628, -0.4848))

        attacker = evaluate_road_access_role(1.8, 800, (117.1628, -0.4848), (117.1639, -0.4839))
        self.assertEqual(attacker["assigned_role"], "ATTACKER")

        direct = evaluate_road_access_role(4.5, 5000, (117.1628, -0.4848), (117.1639, -0.4839))
        self.assertEqual(direct["assigned_role"], "DIRECT_ATTACK")

    def test_calculate_relay_hose_pressure(self):
        res = calculate_relay_hose_pressure(6.0, 100.0)
        self.assertEqual(res["target_nozzle_bar"], 6.0)
        self.assertEqual(res["pressure_loss_bar"], 0.2)
        self.assertEqual(res["required_feeder_pump_bar"], 6.2)
        self.assertTrue(res["is_safe_range"])
        self.assertIsNone(res["warning"])

        burst = calculate_relay_hose_pressure(15.0, 50.0)
        self.assertFalse(burst["is_safe_range"])
        self.assertEqual(burst["warning"], "HOSE_BURST_RISK")

        cutoff = calculate_relay_hose_pressure(0.0, 100.0)
        self.assertEqual(cutoff["required_feeder_pump_bar"], 0.0)
        self.assertEqual(cutoff["warning"], "EMERGENCY_SHUTOFF")

    def test_find_nearest_water_sources(self):
        dummy_sources = [
            {"id": "w1", "name": "Hidran Dekat", "lat": -0.4845, "lng": 117.1630, "status": "READY"},
            {"id": "w2", "name": "Hidran Jauh", "lat": -0.5000, "lng": 117.1500, "status": "READY"},
            {"id": "w3", "name": "Hidran Rusak Kosong", "lat": -0.4846, "lng": 117.1629, "status": "EMPTY"},
        ]
        res = find_nearest_water_sources(-0.4848, 117.1628, dummy_sources, limit=2)
        self.assertEqual(len(res), 2)
        self.assertEqual(res[0]["id"], "w1")
        self.assertEqual(res[1]["id"], "w2")
        self.assertLess(res[0]["distance_meters"], res[1]["distance_meters"])

    def test_evaluate_tidal_suction_viability(self):
        high_tide = datetime(2026, 11, 16, 2, 0, 0, tzinfo=timezone.utc)
        res_high = evaluate_tidal_suction_viability(high_tide)
        self.assertTrue(res_high["is_viable"])
        self.assertEqual(res_high["status"], "READY")
        self.assertGreaterEqual(res_high["water_elevation_meters"], 1.2)

        low_tide = datetime(2026, 11, 16, 8, 12, 0, tzinfo=timezone.utc)
        res_low = evaluate_tidal_suction_viability(low_tide)
        self.assertFalse(res_low["is_viable"])
        self.assertEqual(res_low["status"], "SUCTION_UNAVAILABLE_LOW_TIDE")
        self.assertLess(res_low["water_elevation_meters"], 0.2)
        self.assertEqual(res_low["recommended_alternative_type"], "HYDRANT")

    def test_generate_hose_crossing_barricade(self):
        barricade = generate_hose_crossing_barricade(
            "inc-01",
            "Jl. Pelita",
            "FDR-01",
            (-0.4840, 117.1638),
            (-0.4848, 117.1628),
        )
        self.assertEqual(barricade["color_hex"], "#C026D3")
        self.assertTrue(barricade["is_active"])
        self.assertGreater(barricade["hose_length_meters"], 0.0)
        self.assertFalse(barricade["requires_intermediate_relay"])







if __name__ == "__main__":
    unittest.main()
