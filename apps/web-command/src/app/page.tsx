"use client";

import React, { useState, useEffect } from "react";
import { TacticalSidebar, type SidebarTab } from "../components/TacticalSidebar";
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
import { DEFAULT_SAMARINDA_WATER_SOURCES, type WaterSourcePoint } from "../lib/water-sources";
import { subscribeToIncidentRealtime } from "../lib/supabase-realtime";

export default function WebCommandDashboard() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("COMMAND");
  const [incidentsQueue, setIncidentsQueue] = useState<IncidentQueueItem[]>(DEFAULT_INCIDENT_QUEUE);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    "33333333-3333-3333-3333-333333333301"
  );
  const [incidentStatus, setIncidentStatus] = useState<string>("VERIFIED");
  const [units, setUnits] = useState<TacticalUnitMatrixItem[]>(DEFAULT_TACTICAL_UNITS);
  const [barricades, setBarricades] = useState<ActiveBarricadeItem[]>(DEFAULT_ACTIVE_BARRICADES);
  const [telemetryStream, setTelemetryStream] = useState<TelemetryMutationItem[]>(DEFAULT_TELEMETRY_STREAM);
  const [waterSources, setWaterSources] = useState<WaterSourcePoint[]>(DEFAULT_SAMARINDA_WATER_SOURCES);

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
    <div className="flex h-screen w-screen bg-[#F8F9FA] text-slate-900 font-sans select-none overflow-hidden">
      {/* 1. Sidebar Navigasi Menu Taktis */}
      <TacticalSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeIncidentsCount={incidentsQueue.length}
        activeBarricadesCount={barricades.filter((b) => b.isActive).length}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Posko Induk (Light Mode) */}
        <header className="h-14 border-b border-[#E2E8F0] bg-[#FFFFFF] px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-red-600 inline-block" />
            <h1 className="text-sm font-mono font-bold tracking-wider text-slate-900 uppercase">
              PUSAT KOMANDO OPERASIONAL SAMARINDA • SEKTOR CITRA NIAGA - PELITA
            </h1>
            <span className="text-slate-300 font-mono text-xs">|</span>
            <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
              TAMPILAN: {activeTab}
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-slate-500">STATUS OPERASI: </span>
              <span className="text-emerald-700 font-bold">SIAGA AKTIF</span>
            </div>
            <div>
              <span className="text-slate-500">KOORDINAT SEKTOR: </span>
              <span className="text-slate-900 font-bold tabular-nums">-0.5021° S, 117.1536° E</span>
            </div>
          </div>
        </header>

        {/* Tab 1: KOMANDO TAKTIS (Unified 3-Column Tactical Command) */}
        {activeTab === "COMMAND" && (
          <div className="flex-1 flex flex-row overflow-hidden">
            {/* KOLOM KIRI (Antrean Insiden & Kondisi Pasang Surut Sungai) */}
            <aside className="w-80 border-r border-[#E2E8F0] bg-[#FFFFFF] flex flex-col shrink-0 overflow-y-auto">
              {/* Antrean Insiden Aktif */}
              <div className="p-4 border-b border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
                    ANTREAN INSIDEN AKTIF
                  </p>
                  <span className="text-[10px] font-mono text-red-600 font-bold tabular-nums">
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
                        className={`p-3 border text-xs font-mono cursor-pointer transition-colors shadow-sm ${
                          isSelected
                            ? "bg-red-50 border-red-500"
                            : "bg-[#FFFFFF] border-[#E2E8F0] hover:border-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{item.locationName}</span>
                          <span
                            className={`text-[10px] font-bold uppercase ${
                              item.status === "VERIFIED"
                                ? "text-emerald-700"
                                : item.status === "REPORTED"
                                ? "text-amber-700"
                                : "text-sky-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
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
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8F9FA]">
                <p className="text-xs font-mono font-bold tracking-widest text-sky-800 uppercase mb-2">
                  KONDISI AIR SUNGAI KARANG MUMUS
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">STATUS PASANG:</span>
                    <span className="text-sky-700 font-bold">PASANG MAKSIMAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ELEVASI AIR:</span>
                    <span className="text-slate-900 font-bold tabular-nums">+1.80 METER</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SALINITAS:</span>
                    <span className="text-slate-700 tabular-nums">0.05% (AIR TAWAR)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">KAPASITAS SEDOT:</span>
                    <span className="text-emerald-700 font-bold">OPTIMAL (PORTABEL)</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Stream Kronologis */}
              <div className="p-4 flex-1">
                <TelemetryStreamPanel mutations={telemetryStream} />
              </div>
            </aside>

            {/* KOLOM TENGAH (Kanvas Peta Riil Interaktif Leaflet) */}
            <main className="flex-1 relative flex flex-col overflow-hidden bg-[#E2E8F0]">
              <TacticalMapCanvas
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={setSelectedIncidentId}
                barricades={barricades}
                waterSources={waterSources}
                className="flex-1"
              />
            </main>

            {/* KOLOM KANAN (Matriks Auto-Split & Panel Kontrol FSM) */}
            <aside className="w-96 border-l border-[#E2E8F0] bg-[#FFFFFF] flex flex-col shrink-0 overflow-y-auto">
              <div className="p-4 border-b border-[#E2E8F0]">
                <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-1">
                  PANEL TAKTIS OPERATOR
                </p>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                  KENDALI FSM & PROTOKOL AUTO-SPLIT
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
                <div className="pt-4 border-t border-[#E2E8F0]">
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
        )}

        {/* Tab 2: MATRIKS ARMADA (Fleet Management Focus View) */}
        {activeTab === "UNITS" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#F8F9FA]">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="p-4 bg-white border border-[#E2E8F0] shadow-sm">
                <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-1">
                  MANAJEMEN ARMADA PEMADAM
                </p>
                <h2 className="text-lg font-bold text-slate-900 uppercase">
                  ALOKASI TAKTIS UNIT ATTACKER & FEEDER KOTA SAMARINDA
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-white border border-[#E2E8F0] shadow-sm">
                  <AutoSplitMatrixPanel
                    gangWidthMeters={2.1}
                    units={units}
                    barricades={barricades}
                    onToggleBarricade={handleToggleBarricade}
                  />
                </div>

                <div className="p-4 bg-white border border-[#E2E8F0] shadow-sm space-y-4 font-mono text-xs">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase border-b border-slate-200 pb-2">
                    PANDUAN OPERASIONAL RELAY GANG SEMPIT
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    1. <strong>Unit ATTACKER</strong> (Kapasitas &lt; 1.000 L) berbobot ringan diinstruksikan menembus gang sempit Samarinda berlebar &lt; 2.5 meter menuju titik api.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    2. <strong>Unit FEEDER</strong> (Kapasitas &ge; 3.000 L) dilarang memasuki gang dan wajib parkir terkunci di jalan arteri (&ge; 6 m) untuk membentangkan selang relay bertekanan stabil 4.0 Bar.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    3. Begitu selang terbentang melintasi jalan, sakelar <strong>BARIKADE SELANG (#C026D3)</strong> wajib diaktifkan guna menyiarkan peringatan blokade jalan ke warga dan armada lain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: DIREKTORI AIR (Water Sources & Hydrants Focus View) */}
        {activeTab === "HYDRANTS" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#F8F9FA]">
            <div className="max-w-6xl mx-auto space-y-4">
              <div className="flex items-center justify-between p-4 bg-white border border-[#E2E8F0] shadow-sm">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-1">
                    DIREKTORI LOGISTIK AIR
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 uppercase">
                    30+ SEBARAN HIDRAN, TANDON & DERMAGA SEDOT SAMARINDA
                  </h2>
                </div>
                <div className="text-xs font-mono text-right">
                  <span className="text-slate-500 block">TOTAL TITIK AIR:</span>
                  <span className="text-emerald-700 font-bold tabular-nums">
                    {waterSources.length} TERDAFTAR
                  </span>
                </div>
              </div>

              {/* Tabel Sumber Air */}
              <div className="bg-white border border-[#E2E8F0] shadow-sm overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E2E8F0] text-slate-600">
                      <th className="p-3 font-bold">NAMA TITIK AIR</th>
                      <th className="p-3 font-bold">TIPE</th>
                      <th className="p-3 font-bold">KOORDINAT (WGS 84)</th>
                      <th className="p-3 font-bold">DEBIT (L/MIN)</th>
                      <th className="p-3 font-bold">STATUS OPERASIONAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {waterSources.map((ws) => (
                      <tr key={ws.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{ws.name}</td>
                        <td className="p-3 text-slate-600">{ws.type}</td>
                        <td className="p-3 text-slate-500 tabular-nums">
                          {ws.coordinates[0].toFixed(4)}, {ws.coordinates[1].toFixed(4)}
                        </td>
                        <td className="p-3 font-bold text-slate-900 tabular-nums">
                          {ws.dischargeLitersPerMin} L/min
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-bold ${
                              ws.status === "READY"
                                ? "text-emerald-700"
                                : ws.status === "LOW_DISCHARGE"
                                ? "text-amber-700"
                                : "text-slate-500"
                            }`}
                          >
                            {ws.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: LOG TELEMETRI (CDC Mutation Feed Focus View) */}
        {activeTab === "TELEMETRY" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#F8F9FA]">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="p-4 bg-white border border-[#E2E8F0] shadow-sm">
                <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-1">
                  AUDIT LOG & TELEMETRI CDC
                </p>
                <h2 className="text-lg font-bold text-slate-900 uppercase">
                  ALIRAN MUTASI DATA WAKTU NYATA POSKO INDUK
                </h2>
              </div>

              <div className="p-4 bg-white border border-[#E2E8F0] shadow-sm">
                <TelemetryStreamPanel mutations={telemetryStream} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
