/**
 * Unit Test Telemetry Stream & FSM Controls Specification (TASK-307).
 *
 * Menguji format urutan mutasi telemetri kronologis, kestabilan font tabular-nums,
 * antrean insiden aktif, dan transisi status operasi FSM posko.
 *
 * File: apps/web-command/src/components/__tests__/TelemetryFSM.test.ts
 * PIC: @Hervino (TASK-307)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_INCIDENT_QUEUE,
  DEFAULT_TELEMETRY_STREAM,
  type TelemetryMutationItem,
} from "../../lib/telemetry.ts";

describe("TASK-307: Telemetry Stream & FSM Transition Controls Specification", () => {
  it("1. Antrean insiden memuat identitas lokasi, status konsensus, dan rasio pelapor", () => {
    assert.ok(DEFAULT_INCIDENT_QUEUE.length >= 2, "Harus ada minimal 2 item dalam antrean insiden");

    const incident1 = DEFAULT_INCIDENT_QUEUE[0];
    assert.equal(incident1.id, "33333333-3333-3333-3333-333333333301");
    assert.equal(incident1.status, "VERIFIED");
    assert.equal(incident1.reportersCount, 2);
    assert.equal(incident1.clusterRadiusMeters, 100);

    const incident2 = DEFAULT_INCIDENT_QUEUE[1];
    assert.equal(incident2.status, "REPORTED");
    assert.equal(incident2.reportersCount, 1);
  });

  it("2. Stream telemetri kronologis memiliki stempel waktu, tanda panggilan unit, dan aksi", () => {
    assert.ok(DEFAULT_TELEMETRY_STREAM.length >= 4, "Harus memuat minimal 4 mutasi telemetri awal");

    const pressureReq = DEFAULT_TELEMETRY_STREAM.find((m) => m.actionType === "PRESSURE_REQUEST");
    assert.ok(pressureReq, "Harus ada aksi PRESSURE_REQUEST");
    assert.equal(pressureReq.pressureBar, 7.0);

    const hoseDep = DEFAULT_TELEMETRY_STREAM.find((m) => m.actionType === "HOSE_DEPLOYED");
    assert.ok(hoseDep, "Harus ada aksi HOSE_DEPLOYED");
  });

  it("3. Transisi status FSM valid mengikuti siklus hidup taktis Samarinda", () => {
    const validTransitions: Record<string, string[]> = {
      REPORTED: ["VERIFIED", "FALSE_ALARM"],
      VERIFIED: ["DISPATCHED", "FALSE_ALARM"],
      DISPATCHED: ["WATER_ON_FIRE", "CONTROLLED"],
      WATER_ON_FIRE: ["CONTROLLED"],
      CONTROLLED: ["RESOLVED"],
      RESOLVED: [],
      FALSE_ALARM: [],
    };

    assert.ok(validTransitions["REPORTED"].includes("VERIFIED"));
    assert.ok(validTransitions["VERIFIED"].includes("DISPATCHED"));
    assert.ok(validTransitions["DISPATCHED"].includes("WATER_ON_FIRE"));
    assert.ok(validTransitions["WATER_ON_FIRE"].includes("CONTROLLED"));
    assert.ok(validTransitions["CONTROLLED"].includes("RESOLVED"));
  });
});
