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

    def test_dispatch_role_rules(self):
        self.assertEqual(determine_tactical_role(1.8, 5000), "FEEDER")
        self.assertEqual(determine_tactical_role(1.8, 600), "ATTACKER")
        self.assertEqual(determine_tactical_role(2.0, 1500), "RESERVE_FEEDER")
        self.assertEqual(determine_tactical_role(3.5, 5000), "DIRECT_ATTACK")


if __name__ == "__main__":
    unittest.main()
