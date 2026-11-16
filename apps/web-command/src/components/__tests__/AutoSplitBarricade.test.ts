/**
 * Unit Test Auto-Split Matrix & Fuchsia Barricade Layer (TASK-306).
 *
 * Menguji klasifikasi peran armada taktis berdasarkan batas lebar gang 2.5m,
 * dan spesifikasi lapisan garis barikade selang fuchsia (#D946EF, 4 px).
 *
 * File: apps/web-command/src/components/__tests__/AutoSplitBarricade.test.ts
 * PIC: @Hervino (TASK-306)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TACTICAL_UNITS,
  DEFAULT_ACTIVE_BARRICADES,
  calculateHosePressureLoss,
  MIN_SAFE_PRESSURE_BAR,
  MAX_SAFE_PRESSURE_BAR,
} from "../../lib/tactical-units.ts";
import { generateHoseCrossingBarricade } from "../../../../../packages/spatial-core/src/index.ts";

describe("TASK-306: Auto-Split Matrix & Fuchsia Barricade Specification", () => {
  it("1. Unit kecil (< 1000L) dialokasikan sebagai ATTACKER untuk gang < 2.5m", () => {
    const attackerUnit = DEFAULT_TACTICAL_UNITS.find((u) => u.assignedRole === "ATTACKER");
    assert.ok(attackerUnit, "Harus ada unit dengan peran ATTACKER");
    assert.ok(
      attackerUnit.tankCapacityLiters < 1000,
      `Kapasitas tangki ATTACKER harus < 1000L, aktual: ${attackerUnit.tankCapacityLiters}L`
    );
  });

  it("2. Unit besar (>= 3000L) dialokasikan sebagai FEEDER di jalan arteri", () => {
    const feederUnit = DEFAULT_TACTICAL_UNITS.find((u) => u.assignedRole === "FEEDER");
    assert.ok(feederUnit, "Harus ada unit dengan peran FEEDER");
    assert.ok(
      feederUnit.tankCapacityLiters >= 3000,
      `Kapasitas tangki FEEDER harus >= 3000L, aktual: ${feederUnit.tankCapacityLiters}L`
    );
  });

  it("3. Barikade aktif memiliki identitas jalan dan panjang selang penghubung", () => {
    const activeBarricade = DEFAULT_ACTIVE_BARRICADES.find((b) => b.isActive);
    assert.ok(activeBarricade, "Harus ada minimal 1 barikade aktif");
    assert.ok(activeBarricade.roadName.length > 0, "Nama jalan barikade tidak boleh kosong");
    assert.ok(
      activeBarricade.hoseLengthMeters > 0,
      `Panjang selang harus > 0m, aktual: ${activeBarricade.hoseLengthMeters}m`
    );
  });

  it("4. Loop tekanan dua arah: kompensasi kehilangan friksi selang dan batas aman", () => {
    // 100m selang = 0.2 Bar loss
    const loss100m = calculateHosePressureLoss(100);
    assert.equal(loss100m, 0.2);

    // 150m selang = 0.3 Bar loss
    const loss150m = calculateHosePressureLoss(150);
    assert.equal(loss150m, 0.3);

    // Batas aman operasi hidrolik pemadam Samarinda
    assert.equal(MIN_SAFE_PRESSURE_BAR, 4.0);
    assert.equal(MAX_SAFE_PRESSURE_BAR, 14.0);

    // Seluruh unit default beroperasi dalam batas aman
    for (const unit of DEFAULT_TACTICAL_UNITS) {
      assert.ok(
        unit.waterPressureBar >= MIN_SAFE_PRESSURE_BAR && unit.waterPressureBar <= MAX_SAFE_PRESSURE_BAR,
        `Tekanan unit ${unit.callSign} harus dalam batas aman 4-14 Bar, aktual: ${unit.waterPressureBar}`
      );
    }
  });

  it("5. Pembangkitan Barikade Selang Relay Fuchsia (#C026D3) dan validasi bentang relay", () => {
    // Kasus 1: Bentang standar 110m (relatif pendek, single-stage relay)
    const feederCoords: [number, number] = [-0.4840, 117.1638];
    const attackerCoords: [number, number] = [-0.4848, 117.1628];

    const barricade = generateHoseCrossingBarricade({
      incidentId: "inc-pelita-01",
      roadName: "Jl. Pelita Mulut Gg. 4",
      feederCallSign: "UNIT TANGKI INDUK 05",
      feederCoords,
      attackerCoords,
    });

    assert.equal(barricade.colorHex, "#C026D3");
    assert.equal(barricade.isActive, true);
    assert.ok(barricade.hoseLengthMeters > 50 && barricade.hoseLengthMeters < 200);
    assert.equal(barricade.requiresIntermediateRelay, false);
    assert.ok(barricade.trafficWarningText.includes("PERINGATAN"));

    // Kasus 2: Bentang ekstrem (> 300m) membutuhkan pompa estafet lanjutan (intermediate relay)
    const distantAttackerCoords: [number, number] = [-0.4880, 117.1600];
    const longBarricade = generateHoseCrossingBarricade({
      incidentId: "inc-pelita-long",
      roadName: "Jl. Pelita Raya",
      feederCallSign: "UNIT TANGKI INDUK 05",
      feederCoords,
      attackerCoords: distantAttackerCoords,
    });

    assert.ok(longBarricade.hoseLengthMeters > 300);
    assert.equal(longBarricade.requiresIntermediateRelay, true);
  });
});
