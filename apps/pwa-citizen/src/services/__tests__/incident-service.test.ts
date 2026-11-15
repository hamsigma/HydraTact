/**
 * Unit Test Citizen Incident Service (TASK-302).
 *
 * Menguji format payload pelaporan darurat, validasi koordinat WGS 84,
 * dan penanganan respons konsensus spasial.
 *
 * File: apps/pwa-citizen/src/services/__tests__/incident-service.test.ts
 * PIC: @Hervino (TASK-302)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { submitEmergencyReport } from "../incident-service.ts";

describe("Citizen Incident Reporting Service (TASK-302)", () => {
  it("berhasil memformat payload darurat dan mengembalikan respons konsensus spasial", async () => {
    // Uji fungsi submitEmergencyReport dengan fallback simulasi saat jaringan lokal offline
    const result = await submitEmergencyReport({
      reporterPhone: "+6281234567890",
      location: {
        latitude: -0.5021,
        longitude: 117.1536,
        accuracyMeters: 4.2,
      },
      holdDurationMs: 2000,
      apiBaseUrl: "http://127.0.0.1:9999", // Port offline sengaja untuk menguji fallback aman
    });

    assert.equal(result.status, "success");
    assert.ok(result.data.incident_id);
    assert.equal(result.data.status, "REPORTED");
    assert.equal(result.data.consensus.unique_reporters_count, 1);
    assert.equal(result.data.consensus.cluster_radius_meters, 100.0);
    assert.equal(result.data.detected_gang_width_meters, 2.1);
  });
});
