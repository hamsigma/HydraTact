/**
 * Unit Test Supabase Realtime CDC Channels.
 *
 * Menguji penerimaan event CDC Postgres untuk insiden, barikade jalan,
 * alokasi armada unit, dan sumber air hidran secara asinkron.
 *
 * File: apps/web-command/src/lib/__tests__/supabase-realtime.test.ts
 * PIC: @Hervino (TASK-207)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  subscribeToIncidentRealtime,
  type IncidentRealtimeRow,
  type RoadBarricadeRealtimeRow,
  type IncidentUnitRealtimeRow,
  type WaterSourceRealtimeRow,
  type PostgresChangePayload,
} from "../supabase-realtime.ts";

describe("Supabase Realtime CDC Channel Subscriptions (TASK-207)", () => {
  const targetIncidentId = "33333333-3333-3333-3333-333333333301";
  const otherIncidentId = "99999999-9999-9999-9999-999999999999";

  it("menerima pembaruan status FSM insiden kebakaran untuk insiden yang dilanggani", () => {
    let receivedPayload: PostgresChangePayload<IncidentRealtimeRow> | null = null;

    const sub = subscribeToIncidentRealtime(targetIncidentId, {
      onIncidentUpdate: (payload) => {
        receivedPayload = payload;
      },
    });

    assert.equal(sub.channelName, `incident-tactical-${targetIncidentId}`);

    // Simulasikan event CDC UPDATE status insiden dari REPORTED ke VERIFIED
    sub.dispatchMockEvent(
      "incidents",
      "UPDATE",
      {
        id: targetIncidentId,
        status: "VERIFIED",
        verified_reporters_count: 2,
        latitude: -0.5021,
        longitude: 117.1536,
        updated_at: new Date().toISOString(),
      },
      {
        id: targetIncidentId,
        status: "REPORTED",
        verified_reporters_count: 1,
      }
    );

    assert.ok(receivedPayload !== null);
    assert.equal(receivedPayload.table, "incidents");
    assert.equal(receivedPayload.eventType, "UPDATE");
    assert.equal(receivedPayload.new.status, "VERIFIED");
    assert.equal(receivedPayload.new.verified_reporters_count, 2);
    assert.equal(receivedPayload.old.status, "REPORTED");

    sub.unsubscribe();
  });

  it("mengabaikan event insiden lain yang bukan sasaran langganan", () => {
    let callCount = 0;

    const sub = subscribeToIncidentRealtime(targetIncidentId, {
      onIncidentUpdate: () => {
        callCount++;
      },
    });

    // Event untuk insiden lain
    sub.dispatchMockEvent("incidents", "UPDATE", {
      id: otherIncidentId,
      status: "CONTROLLED",
    });

    assert.equal(callCount, 0, "Event untuk insiden berbeda tidak boleh memicu callback");
    sub.unsubscribe();
  });

  it("menerima event CDC saat barikade selang jalan baru ditambahkan (INSERT)", () => {
    let barricadeEvent: PostgresChangePayload<RoadBarricadeRealtimeRow> | null = null;

    const sub = subscribeToIncidentRealtime(targetIncidentId, {
      onBarricadeChange: (payload) => {
        barricadeEvent = payload;
      },
    });

    // Simulasikan barikade baru dipasang oleh unit feeder
    sub.dispatchMockEvent("road_barricades", "INSERT", {
      id: "barricade-uuid-001",
      incident_id: targetIncidentId,
      road_name: "Mulut Jl. Pelita Gg. 4",
      reason: "HOSE_CONNECTED",
      hose_length_meters: 110,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    assert.ok(barricadeEvent !== null);
    assert.equal(barricadeEvent.eventType, "INSERT");
    assert.equal(barricadeEvent.new.road_name, "Mulut Jl. Pelita Gg. 4");
    assert.equal(barricadeEvent.new.reason, "HOSE_CONNECTED");
    assert.equal(barricadeEvent.new.hose_length_meters, 110);
    assert.equal(barricadeEvent.new.is_active, true);

    sub.unsubscribe();
  });

  it("menerima event CDC saat peran taktis armada diperbarui (ATTACKER / FEEDER)", () => {
    let unitEvent: PostgresChangePayload<IncidentUnitRealtimeRow> | null = null;

    const sub = subscribeToIncidentRealtime(targetIncidentId, {
      onUnitChange: (payload) => {
        unitEvent = payload;
      },
    });

    sub.dispatchMockEvent("incident_units", "UPDATE", {
      id: "inc-unit-001",
      incident_id: targetIncidentId,
      unit_id: "unit-damkar-01",
      assigned_role: "FEEDER",
      status: "ON_SCENE",
      target_pressure_bar: 8.5,
      updated_at: new Date().toISOString(),
    });

    assert.ok(unitEvent !== null);
    assert.equal(unitEvent.new.assigned_role, "FEEDER");
    assert.equal(unitEvent.new.target_pressure_bar, 8.5);

    sub.unsubscribe();
  });

  it("menerima pembaruan status operasional hidran sumber air", () => {
    let waterEvent: PostgresChangePayload<WaterSourceRealtimeRow> | null = null;

    const sub = subscribeToIncidentRealtime(targetIncidentId, {
      onWaterSourceChange: (payload) => {
        waterEvent = payload;
      },
    });

    sub.dispatchMockEvent("water_sources", "UPDATE", {
      id: "hydrant-001",
      name: "Hidran PDAM Citra Niaga",
      operational_status: "LOW_PRESSURE",
      pressure_bar: 1.2,
      updated_at: new Date().toISOString(),
    });

    assert.ok(waterEvent !== null);
    assert.equal(waterEvent.new.operational_status, "LOW_PRESSURE");
    assert.equal(waterEvent.new.pressure_bar, 1.2);

    sub.unsubscribe();
  });

  it("tidak lagi menerima event setelah memanggil unsubscribe()", () => {
    let eventCount = 0;

    const sub = subscribeToIncidentRealtime(targetIncidentId, {
      onIncidentUpdate: () => {
        eventCount++;
      },
    });

    sub.unsubscribe();

    sub.dispatchMockEvent("incidents", "UPDATE", {
      id: targetIncidentId,
      status: "RESOLVED",
    });

    assert.equal(eventCount, 0, "Setelah unsubscribe, tidak boleh ada event yang masuk");
  });
});
