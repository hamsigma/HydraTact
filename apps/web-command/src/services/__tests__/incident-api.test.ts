import test from "node:test";
import assert from "node:assert/strict";
import {
  mapBackendStatusToUI,
  mapUIStatusToBackend,
  fetchActiveIncidents,
  executeManualOverride,
  assignArmadaUnit,
} from "../incident-api.ts";

test("Incident API Service Specification", async (t) => {
  await t.test("1. Memetakan status FSM backend ke UI status secara konsisten", () => {
    assert.equal(mapBackendStatusToUI("PENDING_VERIFICATION"), "REPORTED");
    assert.equal(mapBackendStatusToUI("VERIFIED"), "VERIFIED");
    assert.equal(mapBackendStatusToUI("DISPATCHING"), "DISPATCHED");
    assert.equal(mapBackendStatusToUI("SUPPRESSION_ACTIVE"), "WATER_ON_FIRE");
    assert.equal(mapBackendStatusToUI("OVERHAUL_COOLING"), "CONTROLLED");
    assert.equal(mapBackendStatusToUI("INCIDENT_CLOSED"), "RESOLVED");
    assert.equal(mapBackendStatusToUI("CANCELLED_PRANK"), "FALSE_ALARM");

    assert.equal(mapUIStatusToBackend("REPORTED"), "PENDING_VERIFICATION");
    assert.equal(mapUIStatusToBackend("VERIFIED"), "VERIFIED");
    assert.equal(mapUIStatusToBackend("DISPATCHED"), "DISPATCHING");
    assert.equal(mapUIStatusToBackend("WATER_ON_FIRE"), "SUPPRESSION_ACTIVE");
    assert.equal(mapUIStatusToBackend("CONTROLLED"), "OVERHAUL_COOLING");
    assert.equal(mapUIStatusToBackend("RESOLVED"), "INCIDENT_CLOSED");
  });

  await t.test("2. fetchActiveIncidents mengembalikan antrean bawaan jika backend offline", async () => {
    // Port dummy yang tidak aktif untuk menguji offline graceful fallback
    const result = await fetchActiveIncidents("http://127.0.0.1:59999/api/v1");
    assert.equal(result.isLive, false);
    assert.ok(result.incidents.length >= 2);
    assert.equal(result.incidents[0].status, "VERIFIED");
    assert.equal(result.rawItems[0].incident_id, "33333333-3333-3333-3333-333333333301");
  });

  await t.test("3. executeManualOverride menghasilkan respons sukses dengan status terbarui", async () => {
    const result = await executeManualOverride("33333333-3333-3333-3333-333333333301", {
      targetStatus: "VERIFIED",
      overrideReason: "Verifikasi paksa dari posko komando",
    }, "http://127.0.0.1:59999/api/v1");

    assert.equal(result.success, true);
    assert.ok(result.data);
  });

  await t.test("4. assignArmadaUnit mengalokasikan FEEDER untuk tangki >= 3000L dan ATTACKER untuk tangki < 3000L", async () => {
    const feederResult = await assignArmadaUnit("33333333-3333-3333-3333-333333333301", {
      unitIdentifier: "UNIT 01 CITRA NIAGA",
      waterCapacityLiters: 4000,
      vehicleType: "LARGE_TANK",
    }, "http://127.0.0.1:59999/api/v1");

    assert.equal(feederResult.success, true);
    assert.equal(feederResult.data.data.assigned_role, "FEEDER");
    assert.ok(feederResult.data.data.arterial_staging_point);
    assert.ok(feederResult.data.data.attack_entry_point);

    const attackerResult = await assignArmadaUnit("33333333-3333-3333-3333-333333333301", {
      unitIdentifier: "UNIT 04 TOSSA PORTABLE",
      waterCapacityLiters: 800,
      vehicleType: "PORTABLE_PUMP",
    }, "http://127.0.0.1:59999/api/v1");

    assert.equal(attackerResult.success, true);
    assert.equal(attackerResult.data.data.assigned_role, "ATTACKER");
    assert.ok(attackerResult.data.data.attack_entry_point);
  });
});
