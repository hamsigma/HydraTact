import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { handleTacticalKey, type TacticalHotkeyActions } from "../useTacticalHotkeys.ts";

describe("Web Command Tactical Hotkeys Specification", () => {
  test("1. Menekan tombol '1', '2', '3' memicu pergantian basemap taktis", () => {
    let selectedBasemap: string | null = null;
    const actions: TacticalHotkeyActions = {
      onSelectBasemap: (val) => { selectedBasemap = val; },
    };

    const handled1 = handleTacticalKey({ key: "1" }, actions);
    assert.equal(handled1, true);
    assert.equal(selectedBasemap, "osm");

    const handled2 = handleTacticalKey({ key: "2" }, actions);
    assert.equal(handled2, true);
    assert.equal(selectedBasemap, "hot");

    const handled3 = handleTacticalKey({ key: "3" }, actions);
    assert.equal(handled3, true);
    assert.equal(selectedBasemap, "minimal");
  });

  test("2. Menekan tombol 'I', 'W', 'B' memicu fokus panel navigasi", () => {
    let focusTarget: string | null = null;
    const actions: TacticalHotkeyActions = {
      onFocusIncidents: () => { focusTarget = "INCIDENTS"; },
      onFocusWaterSources: () => { focusTarget = "WATER"; },
      onToggleBarricades: () => { focusTarget = "BARRICADE"; },
    };

    handleTacticalKey({ key: "i" }, actions);
    assert.equal(focusTarget, "INCIDENTS");

    handleTacticalKey({ key: "w" }, actions);
    assert.equal(focusTarget, "WATER");

    handleTacticalKey({ key: "b" }, actions);
    assert.equal(focusTarget, "BARRICADE");
  });

  test("3. Mengabaikan penekanan tombol saat pengguna sedang mengetik di elemen input", () => {
    let triggered = false;
    const actions: TacticalHotkeyActions = {
      onFocusIncidents: () => { triggered = true; },
    };

    const handled = handleTacticalKey(
      { key: "i", target: { tagName: "INPUT" } },
      actions
    );
    assert.equal(handled, false);
    assert.equal(triggered, false);
  });

  test("4. Mengabaikan penekanan tombol kombinasi sistem (Ctrl/Cmd)", () => {
    let triggered = false;
    const actions: TacticalHotkeyActions = {
      onSelectBasemap: () => { triggered = true; },
    };

    const handled = handleTacticalKey({ key: "1", ctrlKey: true }, actions);
    assert.equal(handled, false);
    assert.equal(triggered, false);
  });
});
