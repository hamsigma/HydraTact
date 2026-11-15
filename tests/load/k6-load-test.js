/**
 * k6 Load & Concurrency Benchmark Script (TASK-503).
 *
 * Menguji ketahanan endpoint FastAPI backend HydraTact saat terjadi lonjakan pelaporan massal
 * dan kueri ketersediaan sumber air oleh puluhan relawan damkar di Samarinda.
 *
 * Target:
 * - 100 Virtual Users (VU) konkuren
 * - Durasi minimal 2 menit
 * - Threshold p95 < 150 ms
 * - Error rate < 1%
 *
 * File: tests/load/k6-load-test.js
 * PIC: @Hervino (TASK-503)
 */

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 },  // Ramp-up ke 50 VUs
    { duration: "60s", target: 100 }, // Spike ke 100 VUs
    { duration: "60s", target: 100 }, // Tahan di 100 VUs (Sustained load)
    { duration: "30s", target: 0 },   // Ramp-down
  ],
  thresholds: {
    // 95% request harus selesai di bawah 150 ms (spesifikasi PRD & Task-Hervino)
    http_req_duration: ["p(95)<150"],
    // Tingkat kesalahan request harus di bawah 1% (sukses >= 99%)
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.API_BASE_URL || "http://localhost:8000/api/v1";

export default function () {
  const params = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  // 1. Kueri Spasial Sumber Air Terdekat (GIS PostGIS / Spatial Core)
  const lat = -0.5021 + (Math.random() - 0.5) * 0.01;
  const lng = 117.1536 + (Math.random() - 0.5) * 0.01;
  const waterResp = http.get(
    `${BASE_URL}/water-sources/nearest?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&limit=5&include_low_discharge=true`,
    params
  );
  check(waterResp, {
    "water sources status is 200": (r) => r.status === 200,
    "water sources latency < 150ms": (r) => r.timings.duration < 150,
  });

  sleep(0.5);

  // 2. Kueri Detail Insiden Aktif
  const incidentId = "33333333-3333-3333-3333-333333333301";
  const incidentResp = http.get(`${BASE_URL}/incidents/${incidentId}`, params);
  check(incidentResp, {
    "incident detail status is 200": (r) => r.status === 200,
    "incident detail latency < 150ms": (r) => r.timings.duration < 150,
  });

  sleep(0.5);

  // 3. Pelaporan Darurat Warga (dengan variasi nomor telepon per VU)
  const phoneSuffix = Math.floor(10000000 + Math.random() * 90000000);
  const reportPayload = JSON.stringify({
    reporter_phone: `+62812${phoneSuffix}`,
    location: {
      type: "Point",
      coordinates: [lng, lat],
    },
    gps_accuracy_meters: 4.5,
    haptic_hold_duration_ms: 2050,
    client_timestamp: new Date().toISOString(),
  });

  const reportResp = http.post(`${BASE_URL}/incidents/report`, reportPayload, params);
  check(reportResp, {
    "report incident accepted (201 or 429 rate limited)": (r) =>
      r.status === 201 || r.status === 429,
  });

  sleep(1);
}
