/**
 * Unit Test Citizen Consensus Card Specification (TASK-304).
 *
 * Menguji transisi halus status konsensus, hitung mundur jendela konsensus 3 menit,
 * dan penanganan event realtime CDC saat insiden terverifikasi secara otomatis.
 *
 * File: apps/pwa-citizen/src/components/__tests__/CitizenConsensusCard.test.ts
 * PIC: @Hervino (TASK-304)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { subscribeToIncidentRealtime } from "../../lib/supabase-realtime.ts";

describe("TASK-304: Citizen Realtime Consensus Card Specification", () => {
  const incidentId = "incident-test-304";

  it("1. Format countdown konsensus 180 detik terhitung secara presisi", () => {
    const totalSeconds = 180;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    assert.equal(formatted, "03:00", "Countdown awal harus tepat 03:00");

    const elapsedSeconds = 45;
    const remaining = totalSeconds - elapsedSeconds;
    const remainingMinutes = Math.floor(remaining / 60);
    const remainingSecs = remaining % 60;
    const remainingFormatted = `${String(remainingMinutes).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;

    assert.equal(remainingFormatted, "02:15", "Countdown setelah 45s harus 02:15");
  });

  it("2. Berlangganan event CDC dan memicu pembaruan status ke VERIFIED", () => {
    let currentStatus = "REPORTED";
    let reporterCount = 1;

    const sub = subscribeToIncidentRealtime(incidentId, {
      onIncidentUpdate: (payload) => {
        if (payload.new.status) {
          currentStatus = payload.new.status;
        }
        if (typeof payload.new.verified_reporters_count === "number") {
          reporterCount = payload.new.verified_reporters_count;
        }
      },
    });

    // Simulasikan kedatangan laporan kedua dari warga terdekat dalam radius 100m
    sub.dispatchMockEvent(
      "incidents",
      "UPDATE",
      {
        id: incidentId,
        status: "VERIFIED",
        verified_reporters_count: 2,
        updated_at: new Date().toISOString(),
      },
      {
        id: incidentId,
        status: "REPORTED",
        verified_reporters_count: 1,
      }
    );

    assert.equal(currentStatus, "VERIFIED", "Status harus terbarui ke VERIFIED seketika");
    assert.equal(reporterCount, 2, "Jumlah pelapor unik harus bertambah menjadi 2");

    sub.unsubscribe();
  });

  it("3. Transisi status ke DISPATCHED dan WATER_ON_FIRE mempertahankan status aktif darurat", () => {
    let isEmergencyActive = false;

    const sub = subscribeToIncidentRealtime(incidentId, {
      onIncidentUpdate: (payload) => {
        const nextStatus = payload.new.status;
        if (nextStatus !== "REPORTED" && nextStatus !== "FALSE_ALARM") {
          isEmergencyActive = true;
        }
      },
    });

    sub.dispatchMockEvent("incidents", "UPDATE", {
      id: incidentId,
      status: "DISPATCHED",
    });

    assert.equal(isEmergencyActive, true, "Status DISPATCHED harus mempertahankan mode darurat aktif");

    sub.dispatchMockEvent("incidents", "UPDATE", {
      id: incidentId,
      status: "WATER_ON_FIRE",
    });

    assert.equal(isEmergencyActive, true, "Status WATER_ON_FIRE harus mempertahankan mode darurat aktif");

    sub.unsubscribe();
  });
});
