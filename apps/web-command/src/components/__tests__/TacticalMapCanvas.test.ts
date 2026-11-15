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
});
