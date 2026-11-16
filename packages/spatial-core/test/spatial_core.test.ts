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
  evaluateRoadAccessRole,
  calculateRelayHosePressure,
  findNearestWaterSources,
  evaluateTidalSuctionViability,
  generateHoseCrossingBarricade,
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

test("evaluateRoadAccessRole: penentuan titik staging arteri vs titik serang gang", () => {
  const incidentPoint: [number, number] = [117.1628, -0.4848];
  const arterialPoint: [number, number] = [117.1639, -0.4839];

  // Kasus 1: Gang sempit (< 2.5m) dengan truk besar (5000L) -> FEEDER di jalan arteri
  const feederRes = evaluateRoadAccessRole({
    unitId: "unit-fdr-01",
    unitCode: "FDR-01",
    waterCapacityLiters: 5000,
    roadWidthMeters: 1.8,
    incidentCoordinates: incidentPoint,
    arterialCoordinates: arterialPoint,
  });
  assert.equal(feederRes.assignedRole, "FEEDER");
  assert.deepEqual(feederRes.arterialStagingPoint, arterialPoint);
  assert.deepEqual(feederRes.attackEntryPoint, incidentPoint);
  assert.ok(feederRes.dispatchRationale.includes("FEEDER"));

  // Kasus 2: Gang sempit (< 2.5m) dengan unit lincah (800L) -> ATTACKER menembus gang
  const attackerRes = evaluateRoadAccessRole({
    unitId: "unit-atk-01",
    unitCode: "ATK-01",
    waterCapacityLiters: 800,
    roadWidthMeters: 1.8,
    incidentCoordinates: incidentPoint,
    arterialCoordinates: arterialPoint,
  });
  assert.equal(attackerRes.assignedRole, "ATTACKER");
  assert.deepEqual(attackerRes.attackEntryPoint, incidentPoint);
  assert.ok(attackerRes.dispatchRationale.includes("ATTACKER"));

  // Kasus 3: Jalan lebar (>= 2.5m) -> DIRECT_ATTACK
  const directRes = evaluateRoadAccessRole({
    unitId: "unit-dir-01",
    unitCode: "DIR-01",
    waterCapacityLiters: 5000,
    roadWidthMeters: 6.0,
    incidentCoordinates: incidentPoint,
    arterialCoordinates: arterialPoint,
  });
  assert.equal(directRes.assignedRole, "DIRECT_ATTACK");
  assert.deepEqual(directRes.arterialStagingPoint, incidentPoint);
});

test("calculateRelayHosePressure: kompensasi hidrolik selang relay dan peringatan batas", () => {
  // Kasus 1: Permintaan 6.0 Bar di nozzle dengan bentang selang 100m -> Feeder pump 6.2 Bar
  const res100m = calculateRelayHosePressure(6.0, 100);
  assert.equal(res100m.targetNozzleBar, 6.0);
  assert.equal(res100m.pressureLossBar, 0.2);
  assert.equal(res100m.requiredFeederPumpBar, 6.2);
  assert.equal(res100m.isSafeRange, true);
  assert.equal(res100m.warning, undefined);

  // Kasus 2: Permintaan tekanan ekstrem (> 14 Bar) -> HOSE_BURST_RISK
  const burstRes = calculateRelayHosePressure(15.0, 50);
  assert.equal(burstRes.isSafeRange, false);
  assert.equal(burstRes.warning, "HOSE_BURST_RISK");

  // Kasus 3: Permintaan darurat Cut-Off (0 Bar) -> EMERGENCY_SHUTOFF
  const cutoffRes = calculateRelayHosePressure(0, 100);
  assert.equal(cutoffRes.requiredFeederPumpBar, 0);
  assert.equal(cutoffRes.warning, "EMERGENCY_SHUTOFF");
});

test("findNearestWaterSources: Haversine geodesic sorting dan penyaringan sumber air siap pakai", () => {
  const dummySources = [
    { id: "s1", name: "Hidran Dekat", type: "HYDRANT" as const, coordinates: [-0.4845, 117.1630] as [number, number], status: "READY" as const },
    { id: "s2", name: "Hidran Sedang", type: "HYDRANT" as const, coordinates: [-0.4900, 117.1600] as [number, number], status: "READY" as const },
    { id: "s3", name: "Hidran Rusak Kosong", type: "HYDRANT" as const, coordinates: [-0.4846, 117.1629] as [number, number], status: "EMPTY" as const },
    { id: "s4", name: "Hidran Jauh", type: "HYDRANT" as const, coordinates: [-0.5000, 117.1500] as [number, number], status: "READY" as const },
  ];

  const results = findNearestWaterSources(-0.4848, 117.1628, dummySources, 2);
  assert.equal(results.length, 2);
  assert.equal(results[0].id, "s1");
  assert.equal(results[1].id, "s2");
  assert.ok(results[0].distanceMeters < results[1].distanceMeters);
});

test("evaluateTidalSuctionViability: kalibrasi pasang surut Sungai Karang Mumus", () => {
  const highTideDate = new Date("2026-11-16T02:00:00Z");
  const highTide = evaluateTidalSuctionViability(highTideDate);
  assert.equal(highTide.isViable, true);
  assert.equal(highTide.status, "READY");
  assert.ok(highTide.waterElevationMeters >= 1.2);

  const lowTideDate = new Date("2026-11-16T08:12:00Z");
  const lowTide = evaluateTidalSuctionViability(lowTideDate);
  assert.equal(lowTide.isViable, false);
  assert.equal(lowTide.status, "SUCTION_UNAVAILABLE_LOW_TIDE");
  assert.ok(lowTide.waterElevationMeters < 0.2);
});

test("generateHoseCrossingBarricade: pembentukan geometri barikade selang dan batas relay", () => {
  const barricade = generateHoseCrossingBarricade({
    incidentId: "inc-01",
    roadName: "Jl. Pelita",
    feederCallSign: "FDR-01",
    feederCoords: [-0.4840, 117.1638],
    attackerCoords: [-0.4848, 117.1628],
  });

  assert.equal(barricade.colorHex, "#C026D3");
  assert.equal(barricade.isActive, true);
  assert.ok(barricade.hoseLengthMeters > 0);
  assert.equal(barricade.requiresIntermediateRelay, false);
});






