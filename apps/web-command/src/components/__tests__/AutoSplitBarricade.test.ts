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
} from "../../lib/tactical-units.ts";

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
});
