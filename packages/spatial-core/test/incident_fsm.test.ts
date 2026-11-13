import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isValidFSMTransition,
  executeFSMTransition,
  determineDispatchProtocol,
  ALLOWED_FSM_TRANSITIONS,
} from "../src/incident_fsm.ts";

test("FSM: Transisi normal sekuensial yang sah", () => {
  // PENDING_VERIFICATION -> VERIFIED
  const r1 = isValidFSMTransition("PENDING_VERIFICATION", "VERIFIED");
  assert.equal(r1.isValid, true);

  // VERIFIED -> DISPATCHING
  const r2 = isValidFSMTransition("VERIFIED", "DISPATCHING");
  assert.equal(r2.isValid, true);

  // DISPATCHING -> SUPPRESSION_ACTIVE
  const r3 = isValidFSMTransition("DISPATCHING", "SUPPRESSION_ACTIVE");
  assert.equal(r3.isValid, true);

  // SUPPRESSION_ACTIVE -> OVERHAUL_COOLING
  const r4 = isValidFSMTransition("SUPPRESSION_ACTIVE", "OVERHAUL_COOLING");
  assert.equal(r4.isValid, true);

  // OVERHAUL_COOLING -> INCIDENT_CLOSED
  const r5 = isValidFSMTransition("OVERHAUL_COOLING", "INCIDENT_CLOSED");
  assert.equal(r5.isValid, true);

  // INCIDENT_CLOSED -> ARCHIVED
  const r6 = isValidFSMTransition("INCIDENT_CLOSED", "ARCHIVED");
  assert.equal(r6.isValid, true);
});

test("FSM: Tolak transisi ilegal tanpa override", () => {
  // Langsung dari PENDING_VERIFICATION ke INCIDENT_CLOSED (ilegal)
  const r1 = isValidFSMTransition("PENDING_VERIFICATION", "INCIDENT_CLOSED");
  assert.equal(r1.isValid, false);
  assert.match(r1.reason || "", /Transisi status tidak valid/);

  // Target sama dengan status saat ini
  const r2 = isValidFSMTransition("SUPPRESSION_ACTIVE", "SUPPRESSION_ACTIVE");
  assert.equal(r2.isValid, false);
  assert.match(r2.reason || "", /Status tujuan sama/);

  // Mengubah status dari ARCHIVED (terminal)
  const r3 = isValidFSMTransition("ARCHIVED", "VERIFIED");
  assert.equal(r3.isValid, false);
  assert.match(r3.reason || "", /ARCHIVED.*terminal/);
});

test("FSM: Manual Override oleh posko pada laporan tunggal atau pembatalan darurat", () => {
  // Pelapor tunggal diverifikasi paksa oleh operator
  const r1 = isValidFSMTransition("PENDING_VERIFICATION", "VERIFIED", true);
  assert.equal(r1.isValid, true);

  // Pembatalan darurat (laporan palsu)
  const r2 = isValidFSMTransition("PENDING_VERIFICATION", "CANCELLED_PRANK", true);
  assert.equal(r2.isValid, true);

  // Langsung loncat ke pemadaman aktif jika armada sudah di lokasi
  const r3 = isValidFSMTransition("VERIFIED", "SUPPRESSION_ACTIVE", true);
  assert.equal(r3.isValid, true);
});

test("FSM: Eksekusi transisi dan penentuan protokol dispatching", () => {
  const initialIncident = {
    incidentId: "33333333-3333-3333-3333-333333333301",
    status: "PENDING_VERIFICATION" as const,
    roadWidthMeters: 1.8,
  };

  // Transisi PENDING_VERIFICATION -> VERIFIED via Manual Override
  const out1 = executeFSMTransition(initialIncident, {
    targetStatus: "VERIFIED",
    overrideReason: "Verifikasi HT Posko Balakarcana Jl. Pelita Gg. 4",
    operatorNotes: "Dikonfirmasi api membakar rumah kayu",
  });

  assert.equal(out1.previousStatus, "PENDING_VERIFICATION");
  assert.equal(out1.currentStatus, "VERIFIED");
  assert.equal(out1.isManualOverride, true);
  assert.ok(out1.verifiedAt !== null);

  // Transisi VERIFIED -> DISPATCHING pada gang sempit (1.8m)
  const out2 = executeFSMTransition(
    {
      ...initialIncident,
      status: "VERIFIED",
      verifiedAt: out1.verifiedAt,
    },
    {
      targetStatus: "DISPATCHING",
    }
  );

  assert.equal(out2.currentStatus, "DISPATCHING");
  assert.equal(out2.dispatchProtocol, "AUTO_SPLIT_NARROW_ALLEY");

  // Transisi dengan koreksi lebar jalan menjadi lebar (misal 6.0m)
  const out3 = executeFSMTransition(
    {
      ...initialIncident,
      status: "VERIFIED",
      verifiedAt: out1.verifiedAt,
    },
    {
      targetStatus: "DISPATCHING",
      roadWidthMeters: 6.0,
    }
  );

  assert.equal(out3.roadWidthMeters, 6.0);
  assert.equal(out3.dispatchProtocol, "DIRECT_ATTACK_WIDE_ROAD");

  // Transisi ke INCIDENT_CLOSED mengisi closedAt
  const outClosed = executeFSMTransition(
    {
      ...initialIncident,
      status: "OVERHAUL_COOLING",
      verifiedAt: out1.verifiedAt,
    },
    {
      targetStatus: "INCIDENT_CLOSED",
    }
  );
  assert.equal(outClosed.currentStatus, "INCIDENT_CLOSED");
  assert.ok(outClosed.closedAt !== null);
});
