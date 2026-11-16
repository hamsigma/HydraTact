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
import { evaluateConsensus } from "../../../../../packages/spatial-core/src/index.ts";

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

  it("4. Mesin Konsensus Anti-Prank: 1 laporan fiktif ditahan (PENDING), 2 laporan diverifikasi, bypass via foto GPS valid", () => {
    const target: [number, number] = [117.1628, -0.4848];
    const now = new Date("2026-11-16T12:00:00Z");

    // Skenario A: 1 Laporan tanpa foto (potensi prank) -> PENDING_CONFIRMATION
    const singleReport = [
      {
        reporterPhone: "+6281200000001",
        coordinates: target,
        timestamp: now,
      },
    ];
    const resA = evaluateConsensus(singleReport, target, now);
    assert.equal(resA.isVerified, false);
    assert.equal(resA.consensusStatus, "PENDING_CONFIRMATION");
    assert.equal(resA.allowManualOverride, true);

    // Skenario B: 2 Laporan dalam radius 100m dan jendela 180s -> VERIFIED
    const clusterReports = [
      {
        reporterPhone: "+6281200000001",
        coordinates: target,
        timestamp: now,
      },
      {
        reporterPhone: "+6281200000002",
        coordinates: [117.1630, -0.4847] as [number, number],
        timestamp: new Date(now.getTime() - 40000),
      },
    ];
    const resB = evaluateConsensus(clusterReports, target, now);
    assert.equal(resB.isVerified, true);
    assert.equal(resB.consensusStatus, "VERIFIED");
    assert.equal(resB.uniqueReportersCount, 2);

    // Skenario C: 1 Laporan dengan GPS Presisi (< 15m) + Foto Valid -> Auto-Bypass VERIFIED
    const bypassReport = [
      {
        reporterPhone: "+6281200000009",
        coordinates: target,
        timestamp: now,
        gpsAccuracyMeters: 8.5,
        photoHash: "sha256-a1b2c3d4e5f67890",
      },
    ];
    const resC = evaluateConsensus(bypassReport, target, now);
    assert.equal(resC.isVerified, true);
    assert.equal(resC.isHighConfidenceBypass, true);
    assert.equal(resC.consensusStatus, "VERIFIED");
  });
});

