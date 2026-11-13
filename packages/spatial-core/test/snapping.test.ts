/**
 * Unit Tests untuk Map-Matching Snapping
 * 
 * File: packages/spatial-core/test/snapping.test.ts
 * PIC: @Ilham (TASK-402)
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  projectPointToSegment,
  snapCoordinatesToRoadNetwork,
  type RoadSegment,
} from "../src/index.ts";

// Segmen jalan simulasi Jl. Pelita Gg. 4 (-0.4945 s.d. -0.4940, lon 117.1438 s.d. 117.1442)
const sampleRoadNetwork: RoadSegment[] = [
  {
    roadName: "Jl. Pelita Gang 4",
    roadWidthMeters: 1.8,
    startPoint: [117.1438, -0.4945],
    endPoint: [117.1442, -0.4940],
  },
  {
    roadName: "Jl. Pelita Utama",
    roadWidthMeters: 6.0,
    startPoint: [117.1430, -0.4950],
    endPoint: [117.1458, -0.4931],
  },
];

test("Snapping: Proyeksi titik tegak lurus pada segmen jalan", () => {
  const segA: [number, number] = [117.1438, -0.4945];
  const segB: [number, number] = [117.1442, -0.4940];

  // Titik raw melenceng sedikit ke samping (drift 8 meter)
  const rawPoint: [number, number] = [117.14405, -0.4942];

  const { projectedPoint, distanceMeters } = projectPointToSegment(rawPoint, segA, segB);
  assert.ok(distanceMeters <= 12.0, `Jarak deviasi terhitung: ${distanceMeters}m`);
  assert.ok(projectedPoint[0] >= 117.1438 && projectedPoint[0] <= 117.1442);
});

test("Snapping: Titik dengan deviasi multipath <= 25m berhasil dikunci (isSnapped = true)", () => {
  // Simulasi GPS unit ATTACKER melompat 10 meter di dalam gang 4
  const rawDriftPoint: [number, number] = [117.1440, -0.4942];

  const gang4Only: RoadSegment[] = [
    {
      roadName: "Jl. Pelita Gang 4",
      roadWidthMeters: 1.8,
      startPoint: [117.1438, -0.4945],
      endPoint: [117.1442, -0.4940],
    },
  ];

  const result = snapCoordinatesToRoadNetwork(rawDriftPoint, gang4Only, 25.0);

  assert.equal(result.isSnapped, true);
  assert.equal(result.snappedRoadName, "Jl. Pelita Gang 4");
  assert.equal(result.detectedRoadWidthMeters, 1.8);
  assert.ok(result.deviationMeters <= 25.0);
  assert.notDeepEqual(result.snappedCoordinates, rawDriftPoint);
});

test("Snapping: Titik dengan deviasi > 25m TIDAK dikunci (isSnapped = false, koordinat mentah dipertahankan)", () => {
  // Titik melompat 80 meter jauh ke blok sebelah
  const farPoint: [number, number] = [117.1455, -0.4955];

  const result = snapCoordinatesToRoadNetwork(farPoint, sampleRoadNetwork, 25.0);

  assert.equal(result.isSnapped, false);
  assert.equal(result.snappedRoadName, null);
  assert.ok(result.deviationMeters > 25.0);
  assert.deepEqual(result.snappedCoordinates, farPoint);
});
