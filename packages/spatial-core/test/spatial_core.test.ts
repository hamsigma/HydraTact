/**
 * Unit Tests untuk @hydratact/spatial-core
 * 
 * File: packages/spatial-core/test/spatial_core.test.ts
 * PIC: @Ilham (TASK-202 & TASK-203)
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  haversineDistanceMeters,
  evaluateConsensus,
  determineTacticalRole,
  dispatchUnitRole,
  generateTacticalInstruction,
} from "../src/index.ts";

test("Haversine Distance: akurasi jarak di Jl. Pelita Gg. 4 Samarinda", () => {
  // Koordinat Mulut Gg. 4 vs Titik Api RT 14
  const mulutGg4: [number, number] = [117.1438, -0.4945];
  const titikApiRt14: [number, number] = [117.1441, -0.4942];

  const distance = haversineDistanceMeters(mulutGg4, titikApiRt14);
  assert.ok(distance >= 40.0 && distance <= 60.0, `Jarak terhitung: ${distance}m`);
});

test("Geofencing Consensus: >= 2 pelapor unik dalam radius 100m dan waktu <= 3 mnt -> VERIFIED", () => {
  const center: [number, number] = [117.1441, -0.4942];
  const now = new Date("2026-11-13T20:00:00Z");

  const reports = [
    {
      reporterPhone: "+6281343408542",
      coordinates: [117.1441, -0.4942] as [number, number],
      timestamp: new Date("2026-11-13T19:59:00Z"), // 1 menit lalu
    },
    {
      reporterPhone: "+6281298765431",
      coordinates: [117.1443, -0.4941] as [number, number], // ~25m dari center
      timestamp: new Date("2026-11-13T19:58:30Z"), // 1.5 menit lalu
    },
  ];

  const result = evaluateConsensus(reports, center, now);
  assert.equal(result.isVerified, true);
  assert.equal(result.uniqueReportersCount, 2);
  assert.equal(result.allowManualOverride, false);
});

test("Geofencing Consensus: pelapor tunggal (tengah malam) -> PENDING dengan allowManualOverride = true", () => {
  const center: [number, number] = [117.1441, -0.4942];
  const now = new Date("2026-11-13T02:00:00Z");

  const singleReport = [
    {
      reporterPhone: "+6281343408542",
      coordinates: [117.1441, -0.4942] as [number, number],
      timestamp: new Date("2026-11-13T01:59:30Z"),
    },
  ];

  const result = evaluateConsensus(singleReport, center, now);
  assert.equal(result.isVerified, false);
  assert.equal(result.uniqueReportersCount, 1);
  assert.equal(result.allowManualOverride, true);
});

test("Geofencing Consensus: laporan di luar radius 100m atau usang (> 3 mnt) diabaikan", () => {
  const center: [number, number] = [117.1441, -0.4942];
  const now = new Date("2026-11-13T20:00:00Z");

  const invalidReports = [
    {
      // Laporan 4 menit lalu (> 180s)
      reporterPhone: "+6281111111111",
      coordinates: [117.1441, -0.4942] as [number, number],
      timestamp: new Date("2026-11-13T19:55:00Z"),
    },
    {
      // Laporan jarak jauh (> 300m)
      reporterPhone: "+6282222222222",
      coordinates: [117.1480, -0.4970] as [number, number],
      timestamp: new Date("2026-11-13T19:59:30Z"),
    },
  ];

  const result = evaluateConsensus(invalidReports, center, now);
  assert.equal(result.isVerified, false);
  assert.equal(result.uniqueReportersCount, 0);
});

test("Dynamic Role Dispatching: aturan Auto-Split deterministik", () => {
  // 1. Gang sempit (< 2.5m) & Truk besar (>= 3000L) -> FEEDER
  assert.equal(determineTacticalRole(1.8, 5000), "FEEDER");
  assert.equal(determineTacticalRole(2.4, 3000), "FEEDER");

  // 2. Gang sempit (< 2.5m) & Unit roda tiga / pompa jinjing (< 1000L) -> ATTACKER
  assert.equal(determineTacticalRole(1.8, 600), "ATTACKER");
  assert.equal(determineTacticalRole(1.5, 800), "ATTACKER");

  // 3. Gang sempit (< 2.5m) & Unit sedang (1000L - 2999L) -> RESERVE_FEEDER
  assert.equal(determineTacticalRole(2.0, 1500), "RESERVE_FEEDER");
  assert.equal(determineTacticalRole(2.2, 2500), "RESERVE_FEEDER");

  // 4. Jalan lebar (>= 2.5m) -> DIRECT_ATTACK
  assert.equal(determineTacticalRole(3.5, 5000), "DIRECT_ATTACK");
  assert.equal(determineTacticalRole(6.0, 600), "DIRECT_ATTACK");
});

test("Dynamic Role Dispatching: dispatchUnitRole menghasilkan instruksi taktis operasional", () => {
  const tossaUnit = {
    unitId: "unit-atk-04",
    unitCode: "ATK-04",
    waterCapacityLiters: 600,
  };

  const decision = dispatchUnitRole(tossaUnit, 1.8);
  assert.equal(decision.assignedRole, "ATTACKER");
  assert.ok(decision.tacticalInstruction.includes("Unit lincah maju"));

  const tankerUnit = {
    unitId: "unit-fdr-02",
    unitCode: "FDR-02",
    waterCapacityLiters: 5000,
  };

  const tankerDecision = dispatchUnitRole(tankerUnit, 1.8);
  assert.equal(tankerDecision.assignedRole, "FEEDER");
  assert.ok(tankerDecision.tacticalInstruction.includes("BERHENTI di jalan arteri"));
});
