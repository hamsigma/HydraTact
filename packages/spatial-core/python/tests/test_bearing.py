import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from spatial_core import calculate_compass_bearing

class TestCompassBearing(unittest.TestCase):
    def test_north_bearing(self):
        res = calculate_compass_bearing(-0.4950, 117.1438, -0.4900, 117.1438)
        self.assertEqual(res["cardinal_indonesian"], "U")
        self.assertEqual(res["bearing_degrees"], 0)

    def test_east_bearing(self):
        res = calculate_compass_bearing(-0.4950, 117.1400, -0.4950, 117.1500)
        self.assertEqual(res["cardinal_indonesian"], "T")
        self.assertEqual(res["bearing_degrees"], 90)

    def test_pelita_to_skm_bearing(self):
        res = calculate_compass_bearing(-0.4948, 117.1438, -0.4955, 117.1465)
        self.assertTrue(90 <= res["bearing_degrees"] <= 135)
        self.assertIn(res["cardinal_indonesian"], ["T", "TG"])

if __name__ == "__main__":
    unittest.main()
