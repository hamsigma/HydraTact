import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from spatial_core.incident_fsm import (
    IncidentFSMStatus,
    is_valid_fsm_transition,
    execute_fsm_transition,
    determine_dispatch_protocol,
)


class TestIncidentFSM(unittest.TestCase):
    def test_valid_sequential_transitions(self):
        valid_chain = [
            ("PENDING_VERIFICATION", "VERIFIED"),
            ("VERIFIED", "DISPATCHING"),
            ("DISPATCHING", "SUPPRESSION_ACTIVE"),
            ("SUPPRESSION_ACTIVE", "OVERHAUL_COOLING"),
            ("OVERHAUL_COOLING", "INCIDENT_CLOSED"),
            ("INCIDENT_CLOSED", "ARCHIVED"),
        ]
        for curr, nxt in valid_chain:
            is_valid, reason = is_valid_fsm_transition(curr, nxt)
            self.assertTrue(is_valid, f"Should be valid: {curr} -> {nxt}. Error: {reason}")

    def test_invalid_transitions(self):
        # Langsung lompat ilegal
        is_valid, reason = is_valid_fsm_transition("PENDING_VERIFICATION", "INCIDENT_CLOSED")
        self.assertFalse(is_valid)
        self.assertIn("Transisi status tidak valid", reason)

        # Status sama
        is_valid, reason = is_valid_fsm_transition("VERIFIED", "VERIFIED")
        self.assertFalse(is_valid)
        self.assertIn("Status tujuan sama", reason)

        # Terminal status
        is_valid, reason = is_valid_fsm_transition("ARCHIVED", "DISPATCHING")
        self.assertFalse(is_valid)
        self.assertIn("ARCHIVED", reason)

    def test_manual_override(self):
        # Override pelapor tunggal
        is_valid, _ = is_valid_fsm_transition("PENDING_VERIFICATION", "VERIFIED", is_override=True)
        self.assertTrue(is_valid)

        # Override pembatalan
        is_valid, _ = is_valid_fsm_transition("DISPATCHING", "CANCELLED_PRANK", is_override=True)
        self.assertTrue(is_valid)

    def test_execute_transition(self):
        incident = {
            "id": "33333333-3333-3333-3333-333333333301",
            "status": "PENDING_VERIFICATION",
            "road_width_meters": 1.80,
            "verified_at": None,
            "closed_at": None,
        }

        # Override verify
        res1 = execute_fsm_transition(
            incident,
            target_status="VERIFIED",
            override_reason="Verifikasi HT Balakarcana",
        )
        self.assertEqual(res1["previous_status"], "PENDING_VERIFICATION")
        self.assertEqual(res1["current_status"], "VERIFIED")
        self.assertTrue(res1["is_manual_override"])
        self.assertIsNotNone(res1["verified_at"])

        # Dispatch narrow alley
        incident["status"] = "VERIFIED"
        incident["verified_at"] = res1["verified_at"]
        res2 = execute_fsm_transition(incident, target_status="DISPATCHING")
        self.assertEqual(res2["current_status"], "DISPATCHING")
        self.assertEqual(res2["dispatch_protocol"], "AUTO_SPLIT_NARROW_ALLEY")


if __name__ == "__main__":
    unittest.main()
