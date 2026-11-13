"""Unit tests untuk Python snapping."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from spatial_core import (
    project_point_to_segment,
    snap_coordinates_to_road_network,
)


class TestPythonSnapping(unittest.TestCase):
    def setUp(self):
        self.road_network = [
            {
                "road_name": "Jl. Pelita Gang 4",
                "road_width_meters": 1.8,
                "start_point": (117.1438, -0.4945),
                "end_point": (117.1442, -0.4940),
            }
        ]

    def test_snapping_drift_under_25m(self):
        # Drift 12m
        raw_pt = (117.14408, -0.49423)
        res = snap_coordinates_to_road_network(raw_pt, self.road_network, 25.0)
        self.assertTrue(res["is_snapped"])
        self.assertEqual(res["snapped_road_name"], "Jl. Pelita Gang 4")
        self.assertEqual(res["detected_road_width_meters"], 1.8)
        self.assertTrue(res["deviation_meters"] <= 25.0)

    def test_snapping_drift_over_25m(self):
        # Drift 60m
        raw_pt = (117.1448, -0.4948)
        res = snap_coordinates_to_road_network(raw_pt, self.road_network, 25.0)
        self.assertFalse(res["is_snapped"])
        self.assertEqual(res["snapped_coordinates"], raw_pt)


if __name__ == "__main__":
    unittest.main()
