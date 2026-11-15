"use client";

import React, { useState, useEffect } from "react";
import { TacticalMapCanvas } from "../components/TacticalMapCanvas";
import {
  AutoSplitMatrixPanel,
  DEFAULT_TACTICAL_UNITS,
  DEFAULT_ACTIVE_BARRICADES,
  type ActiveBarricadeItem,
  type TacticalUnitMatrixItem,
} from "../components/AutoSplitMatrixPanel";
import { TelemetryStreamPanel } from "../components/TelemetryStreamPanel";
import { FSMControlPanel } from "../components/FSMControlPanel";
import {
  DEFAULT_INCIDENT_QUEUE,
  DEFAULT_TELEMETRY_STREAM,
  type IncidentQueueItem,
  type TelemetryMutationItem,
} from "../lib/telemetry";
import { subscribeToIncidentRealtime } from "../lib/supabase-realtime";

export default function WebCommandDashboard() {
  const [incidentsQueue, setIncidentsQueue] = useState<IncidentQueueItem[]>(DEFAULT_INCIDENT_QUEUE);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    "33333333-3333-3333-3333-333333333301"
  );
  const [incidentStatus, setIncidentStatus] = useState<string>("VERIFIED");
  const [units, setUnits] = useState<TacticalUnitMatrixItem[]>(DEFAULT_TACTICAL_UNITS);
  const [barricades, setBarricades] = useState<ActiveBarricadeItem[]>(DEFAULT_ACTIVE_BARRICADES);
  const [telemetryStream, setTelemetryStream] = useState<TelemetryMutationItem[]>(DEFAULT_TELEMETRY_STREAM);

  // Berlangganan Saluran Supabase Realtime CDC untuk insiden aktif
  useEffect(() => {
    const sub = subscribeToIncidentRealtime(selectedIncidentId, {
      onBarricadeChange: (payload) => {
        const row = payload.new;
        if (!row) return;

        setBarricades((prev) => {
          const index = prev.findIndex((b) => b.id === row.id);
          const newItem: ActiveBarricadeItem = {
            id: row.id,
            roadName: row.road_name,
            feederCallSign: "UNIT TANGKI INDUK 05",
            hoseLengthMeters: row.hose_length_meters || 100,
            isActive: row.is_active,
            createdAt: row.created_at,
          };

          if (index >= 0) {
            const next = [...prev];
            next[index] = newItem;
            return next;
          }
          return [...prev, newItem];
        });

        // Tambahkan ke stream telemetri
        setTelemetryStream((prev) => [
          {
            id: "mut-" + Date.now(),
            timestamp: new Date().toLocaleTimeString("id-ID", { hour12: false }),
            callSign: "UNIT TANGKI INDUK 05",
            actionType: "HOSE_DEPLOYED",
            description: `Barikade ${row.road_name} status: ${row.is_active ? "TERPASANG" : "DILEPAS"}`,
          },
          ...prev,
        ]);
      },
      onUnitChange: (payload) => {
        const row = payload.new;
        if (!row) return;

        setUnits((prev) =>
          prev.map((u) =>
            u.id === row.unit_id || u.callSign.includes(row.unit_id)
              ? {
                  ...u,
                  assignedRole: row.assigned_role,
                  targetPressureBar: row.target_pressure_bar ?? u.targetPressureBar,
                }
              : u
          )
        );
      },
      onIncidentUpdate: (payload) => {
        if (payload.new?.status) {
          const newStatus = payload.new.status;
          setIncidentStatus(newStatus);
          setIncidentsQueue((prev) =>
            prev.map((inc) => (inc.id === selectedIncidentId ? { ...inc, status: newStatus } : inc))
          );
        }
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [selectedIncidentId]);

  const handleToggleBarricade = (barricadeId: string, currentActive: boolean) => {
    setBarricades((prev) =>
      prev.map((b) => (b.id === barricadeId ? { ...b, isActive: !currentActive } : b))
    );
  };

  const handleExecuteFSMTransition = async (targetStatus: string, isOverride?: boolean) => {
    setIncidentStatus(targetStatus);
    setIncidentsQueue((prev) =>
      prev.map((inc) => (inc.id === selectedIncidentId ? { ...inc, status: targetStatus as any } : inc))
    );

    setTelemetryStream((prev) => [
      {
        id: "mut-" + Date.now(),
        timestamp: new Date().toLocaleTimeString("id-ID", { hour12: false }),
        callSign: "POSKO INDUK",
        actionType: "ROLE_REASSIGNED",
        description: isOverride
          ? `OVERRIDE MANUAL OLEH POSKO: Transisi paksa ke ${targetStatus}`
          : `TRANSISI FSM PROTOKOL: Berpindah ke status ${targetStatus}`,
      },
      ...prev,
    ]);
  };

  const activeIncident = incidentsQueue.find((i) => i.id === selectedIncidentId) || incidentsQueue[0];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090E] text-stone-100 font-sans select-none overflow-hidden">
      {/* Top Bar Posko Induk */}
      <header className="h-12 border-b border-stone-800 bg-[#0A0D14] px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-red-600 animate-pulse" />
          <h1 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
            HYDRATACT SAMARINDA • PUSAT KOMANDO POSKO INDUK
          </h1>
          <span className="text-stone-600 font-mono text-xs">|</span>
          <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase">
            SEKTOR PELITA - CITRA NIAGA
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono">
          <div>
            <span className="text-stone-500">POSKO STATUS: </span>
            <span className="text-emerald-400 font-bold">OPERASIONAL AKTIF</span>
          </div>
          <div>
            <span className="text-stone-500">LATENSI POSTGIS: </span>
            <span className="text-stone-200 font-bold tabular-nums">1.2ms</span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Tactical Workspace */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* KOLOM KIRI (Antrean Insiden & Kondisi Pasang Surut Sungai) */}
        <aside className="w-84 border-r border-stone-800 bg-[#080B10] flex flex-col shrink-0 overflow-y-auto">
          {/* Header Panel Kiri: Antrean Insiden Aktif */}
          <div className="p-4 border-b border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase">
                ANTEAN INSIDEN AKTIF
              </p>
              <span className="text-[10px] font-mono text-red-400 font-bold tabular-nums">
                {incidentsQueue.length} TITIK
              </span>
            </div>

            <div className="space-y-2">
              {incidentsQueue.map((item) => {
                const isSelected = item.id === selectedIncidentId;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedIncidentId(item.id);
                      setIncidentStatus(item.status);
                    }}
                    className={`p-3 border text-xs font-mono cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#0A0F1D] border-red-700"
                        : "bg-[#06080D] border-stone-850 hover:border-stone-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{item.locationName}</span>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          item.status === "VERIFIED"
                            ? "text-emerald-400"
                            : item.status === "REPORTED"
                            ? "text-amber-400"
                            : "text-cyan-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                      <span className="tabular-nums">
                        KONSENSUS: {item.reportersCount}/{item.consensusTarget} (R{item.clusterRadiusMeters}M)
                      </span>
                      <span className="tabular-nums">{item.elapsedMinutes}M LALU</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kondisi Pasang Surut SKM */}
          <div className="p-4 border-b border-stone-800 bg-[#06080D]">
            <p className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-2">
              KONDISI AIR SUNGAI KARANG MUMUS
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-stone-400">STATUS PASANG:</span>
                <span className="text-cyan-300 font-bold">PASANG MAKSIMAL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">KETINGGIAN AIR:</span>
                <span className="text-white font-bold tabular-nums">+1.80 METER</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">SALINITAS:</span>
                <span className="text-stone-300 tabular-nums">0.05% (AIR TAWAR)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">KAPASITAS SEDOT:</span>
                <span className="text-emerald-400 font-bold">OPTIMAL (PORTABEL)</span>
              </div>
            </div>
          </div>

          {/* Telemetry Stream Kronologis */}
          <div className="p-4 flex-1">
            <TelemetryStreamPanel mutations={telemetryStream} />
          </div>
        </aside>

        {/* KOLOM TENGAH (Kanvas Peta Taktis Leaflet Layar Penuh) */}
        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#05070A]">
          <TacticalMapCanvas
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={setSelectedIncidentId}
            barricades={barricades}
            className="flex-1"
          />
        </main>

        {/* KOLOM KANAN (Matriks Auto-Split & Panel Kontrol FSM) */}
        <aside className="w-96 border-l border-stone-800 bg-[#080B10] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-stone-800">
            <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase mb-1">
              PANEL TAKTIS OPERATOR
            </p>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              MATRIKS AUTO-SPLIT & KENDALI FSM
            </h2>
          </div>

          <div className="p-4 flex-1 space-y-6">
            {/* Kendali Protokol FSM */}
            <FSMControlPanel
              currentStatus={incidentStatus}
              incidentId={selectedIncidentId}
              onExecuteTransition={handleExecuteFSMTransition}
            />

            {/* Matriks Auto-Split & Barikade */}
            <div className="pt-4 border-t border-stone-800">
              <AutoSplitMatrixPanel
                gangWidthMeters={2.1}
                units={units}
                barricades={barricades}
                onToggleBarricade={handleToggleBarricade}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
