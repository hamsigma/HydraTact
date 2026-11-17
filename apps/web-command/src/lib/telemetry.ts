/**
 * Model Telemetri Kronologis & Antrean Insiden Posko.
 *
 * File: apps/web-command/src/lib/telemetry.ts
 * PIC: @Hervino (TASK-307)
 */

export interface IncidentQueueItem {
  id: string;
  locationName: string;
  coordinates?: [number, number]; // [latitude, longitude]
  status: "REPORTED" | "VERIFIED" | "DISPATCHED" | "WATER_ON_FIRE" | "CONTROLLED" | "RESOLVED" | "FALSE_ALARM";
  reportersCount: number;
  consensusTarget: number;
  clusterRadiusMeters: number;
  reporterPhone?: string;
  reportedAt: string;
  elapsedMinutes: number;
}

export interface ResolvedIncidentHistoryItem {
  id: string;
  incidentCode: string;
  locationName: string;
  status: "RESOLVED";
  reportersCount: number;
  reportedAt: string;
  resolvedAt: string;
  durationMinutes: number;
  operatorNotes: string;
  unitsInvolved: string;
  coordinates: [number, number];
}

export interface TelemetryMutationItem {
  id: string;
  timestamp: string;
  callSign: string;
  actionType: "PRESSURE_REQUEST" | "HOSE_DEPLOYED" | "HYDRANT_STATUS_UPDATE" | "ROLE_REASSIGNED";
  description: string;
  pressureBar?: number;
}

export const DEFAULT_INCIDENT_QUEUE: IncidentQueueItem[] = [
  {
    id: "33333333-3333-3333-3333-333333333301",
    locationName: "Gg. 4 Jl. Pelita, Samarinda Kota",
    coordinates: [-0.4848, 117.1628],
    status: "VERIFIED",
    reportersCount: 2,
    consensusTarget: 2,
    clusterRadiusMeters: 100,
    reporterPhone: "+6281255881234",
    reportedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    elapsedMinutes: 8,
  },
  {
    id: "33333333-3333-3333-3333-333333333302",
    locationName: "Gg. Madura Pasar Segiri",
    coordinates: [-0.4828, 117.148],
    status: "REPORTED",
    reportersCount: 1,
    consensusTarget: 2,
    clusterRadiusMeters: 100,
    reporterPhone: "+6285249117890",
    reportedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    elapsedMinutes: 2,
  },
];

export const DEFAULT_TELEMETRY_STREAM: TelemetryMutationItem[] = [
  {
    id: "tel-01",
    timestamp: "18:24:10",
    callSign: "UNIT BALAKARCANA 01",
    actionType: "PRESSURE_REQUEST",
    description: "Permintaan kenaikan tekanan nozzle ke 7.0 bar",
    pressureBar: 7.0,
  },
  {
    id: "tel-02",
    timestamp: "18:22:45",
    callSign: "UNIT TANGKI INDUK 05",
    actionType: "HOSE_DEPLOYED",
    description: "Bentangan selang relay 110m terpasang di Mulut Jl. Pelita",
  },
  {
    id: "tel-03",
    timestamp: "18:20:15",
    callSign: "RELAWAN 03 CITRA NIAGA",
    actionType: "HYDRANT_STATUS_UPDATE",
    description: "Hidran PDAM Citra Niaga No. 1 status READY (1200 L/min)",
  },
  {
    id: "tel-04",
    timestamp: "18:18:00",
    callSign: "POSKO INDUK",
    actionType: "ROLE_REASSIGNED",
    description: "Auto-Split: Unit 01 ditugaskan ATTACKER, Unit 05 ditugaskan FEEDER",
  },
];

export const DEFAULT_RESOLVED_HISTORY: ResolvedIncidentHistoryItem[] = [
  {
    id: "33333333-3333-3333-3333-333333333399",
    incidentCode: "HT-2026-081",
    locationName: "Jl. Lambung Mangkurat Gg. 2",
    status: "RESOLVED",
    reportersCount: 3,
    reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    resolvedAt: "17:40 WITA",
    durationMinutes: 28,
    operatorNotes: "Api pokok pada bangunan semi-permanen berhasil dipadamkan tuntas. Pendinginan bara selesai, nihil korban jiwa.",
    unitsInvolved: "UNIT 02 CITRA NIAGA & RELAWAN 03",
    coordinates: [-0.4890, 117.1580],
  },
];
