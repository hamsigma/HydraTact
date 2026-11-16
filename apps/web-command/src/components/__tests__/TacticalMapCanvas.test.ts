/**
 * Unit Test Tactical Map Canvas (TASK-305).
 *
 * Menguji rendering 30 titik sumber air Samarinda, status pasang surut SKM,
 * dan penanda denyut titik api aktif.
 *
 * File: apps/web-command/src/components/__tests__/TacticalMapCanvas.test.ts
 * PIC: @Hervino (TASK-305)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SAMARINDA_WATER_SOURCES,
  findNearestWaterSources,
  evaluateTidalSuctionViability,
  type WaterSourcePoint,
} from "../../lib/water-sources.ts";

describe("TASK-305: Tactical Map Canvas Specification", () => {
  it("1. Menyediakan minimal 30 titik sebaran sumber air Samarinda", () => {
    assert.ok(
      DEFAULT_SAMARINDA_WATER_SOURCES.length >= 30,
      `Harus ada minimal 30 titik sumber air, ditemukan: ${DEFAULT_SAMARINDA_WATER_SOURCES.length}`
    );
  });

  it("2. Memiliki klasifikasi tipe sumber air lengkap (HYDRANT, WATER_TANK, RIVER_DOCK)", () => {
    const types = new Set(DEFAULT_SAMARINDA_WATER_SOURCES.map((s) => s.type));
    assert.ok(types.has("HYDRANT"), "Harus memiliki tipe HYDRANT");
    assert.ok(types.has("WATER_TANK"), "Harus memiliki tipe WATER_TANK");
    assert.ok(types.has("RIVER_DOCK"), "Harus memiliki tipe RIVER_DOCK (Dermaga Sungai SKM/Mahakam)");
  });

  it("3. Titik sumber air memiliki koordinat valid dalam batas geografis Samarinda", () => {
    // Batas geografis Kota Samarinda: lat [-0.70 s.d -0.35], lng [117.05 s.d 117.25]
    for (const ws of DEFAULT_SAMARINDA_WATER_SOURCES) {
      const [lat, lng] = ws.coordinates;
      assert.ok(
        lat <= -0.35 && lat >= -0.7,
        `Latitude ${lat} untuk ${ws.name} di luar batas Samarinda`
      );
      assert.ok(
        lng >= 117.05 && lng <= 117.25,
        `Longitude ${lng} untuk ${ws.name} di luar batas Samarinda`
      );
    }
  });

  it("4. Status operasional sumber air mencakup READY, LOW_DISCHARGE, dan EMPTY", () => {
    const statuses = new Set(DEFAULT_SAMARINDA_WATER_SOURCES.map((s) => s.status));
    assert.ok(statuses.has("READY"), "Harus memiliki status READY");
    assert.ok(statuses.has("LOW_DISCHARGE"), "Harus memiliki status LOW_DISCHARGE");
    assert.ok(statuses.has("EMPTY"), "Harus memiliki status EMPTY");
  });

  it("5. Haversine Sorting: mengurutkan sumber air terdekat secara akurat dan menyaring status EMPTY", () => {
    // Lokasi kebakaran Jl. Pelita Gg. 4
    const incidentLat = -0.4848;
    const incidentLng = 117.1628;

    const nearest = findNearestWaterSources(incidentLat, incidentLng, DEFAULT_SAMARINDA_WATER_SOURCES, 3);
    assert.equal(nearest.length, 3);

    // Sumber air pertama terdekat dari Gg. 4 Pelita harus Tandon Gg. 4 (ws-25) atau Hidran Mulut Pelita (ws-26)
    assert.ok(
      nearest[0].id === "ws-25" || nearest[0].id === "ws-26",
      `Sumber air terdekat harus di sekitar Jl. Pelita, ditemukan: ${nearest[0].name}`
    );
    assert.ok(nearest[0].distanceMeters < 300, `Jarak harus < 300m, aktual: ${nearest[0].distanceMeters}m`);
    assert.ok(nearest[0].estimatedTravelMinutes < 1.0, "ETA harus < 1 menit");

    // Pastikan terurut menaik (ascending)
    assert.ok(nearest[0].distanceMeters <= nearest[1].distanceMeters);
    assert.ok(nearest[1].distanceMeters <= nearest[2].distanceMeters);

    // Sumber air berstatus EMPTY tidak boleh masuk ke rekomendasi
    for (const item of nearest) {
      assert.notEqual(item.status, "EMPTY");
    }
  });

  it("6. Kalibrasi Pasang Surut SKM: evaluasi ketinggian air dan peralihan fallback saat surut", () => {
    // Puncak pasang (02:00 UTC)
    const highTideDate = new Date("2026-11-16T02:00:00Z");
    const highTide = evaluateTidalSuctionViability(highTideDate, 2800);
    assert.equal(highTide.isViable, true);
    assert.equal(highTide.status, "READY");
    assert.ok(highTide.waterElevationMeters >= 1.2);
    assert.equal(highTide.effectiveDischargeLpm, 2800);

    // Titik surut ekstrem (08:12 UTC = 02:00 + 6.2 jam)
    const lowTideDate = new Date("2026-11-16T08:12:00Z");
    const lowTide = evaluateTidalSuctionViability(lowTideDate, 2800);
    assert.equal(lowTide.isViable, false);
    assert.equal(lowTide.status, "SUCTION_UNAVAILABLE_LOW_TIDE");
    assert.ok(lowTide.waterElevationMeters < 0.2);
    assert.equal(lowTide.effectiveDischargeLpm, 0);
    assert.equal(lowTide.recommendedAlternativeType, "HYDRANT");
  });
});
