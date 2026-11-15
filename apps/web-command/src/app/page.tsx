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
import { subscribeToIncidentRealtime } from "../lib/supabase-realtime";

export default function WebCommandDashboard() {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    "33333333-3333-3333-3333-333333333301"
  );
  const [incidentStatus, setIncidentStatus] = useState<string>("VERIFIED");
  const [units, setUnits] = useState<TacticalUnitMatrixItem[]>(DEFAULT_TACTICAL_UNITS);
  const [barricades, setBarricades] = useState<ActiveBarricadeItem[]>(DEFAULT_ACTIVE_BARRICADES);

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
          setIncidentStatus(payload.new.status);
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
        {/* KOLOM KIRI (Panel Insiden & Kondisi Pasang Surut Sungai) */}
        <aside className="w-80 border-r border-stone-800 bg-[#080B10] flex flex-col shrink-0 overflow-y-auto">
          {/* Header Panel Kiri */}
          <div className="p-4 border-b border-stone-800">
            <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase mb-1">
              INSIDEN AKTIF
            </p>
            <h2 className="text-base font-bold text-white tracking-tight">
              Gg. 4 Jl. Pelita, Samarinda Kota
            </h2>
            <div className="mt-2 flex items-center justify-between text-xs font-mono">
              <span className="text-stone-500">STATUS TAKTIS:</span>
              <span className="font-bold text-red-400 tracking-wider uppercase">
                {incidentStatus}
              </span>
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

          {/* Ringkasan Disposisi Armada Samping */}
          <div className="p-4 flex-1">
            <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase mb-3">
              UNIT KELUARAN AKTIF
            </p>
            <div className="space-y-3">
              {units.map((u) => (
                <div key={u.id} className="p-3 bg-[#0A0E17] border border-stone-800 text-xs font-mono">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-white">{u.callSign}</span>
                    <span
                      className={`font-bold ${
                        u.assignedRole === "ATTACKER" ? "text-cyan-400" : "text-amber-400"
                      }`}
                    >
                      {u.assignedRole}
                    </span>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Tangki {u.tankCapacityLiters}L • Jarak: {u.distanceFromFireMeters}m
                  </p>
                </div>
              ))}
            </div>
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

        {/* KOLOM KANAN (Matriks Auto-Split & Barikade Fuchsia) */}
        <aside className="w-96 border-l border-stone-800 bg-[#080B10] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-stone-800">
            <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase mb-1">
              PANEL TAKTIS ARMADA
            </p>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              MATRIKS AUTO-SPLIT & BARIKADE
            </h2>
          </div>

          <div className="p-4 flex-1">
            <AutoSplitMatrixPanel
              gangWidthMeters={2.1}
              units={units}
              barricades={barricades}
              onToggleBarricade={handleToggleBarricade}
            />

            {/* Kontrol Transisi Status FSM Insiden */}
            <div className="mt-6 pt-4 border-t border-stone-800">
              <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase mb-3">
                TRANSISI STATUS PROTOKOL (FSM)
              </p>
              <div className="space-y-2">
                {[
                  { status: "WATER_ON_FIRE", label: "AIR MENYEMBUR KE API", color: "border-cyan-700 hover:bg-cyan-950/50" },
                  { status: "CONTROLLED", label: "API BERHASIL DIKUASAI", color: "border-amber-700 hover:bg-amber-950/50" },
                  { status: "RESOLVED", label: "PEMADAMAN SELESAI (DINGIN)", color: "border-emerald-700 hover:bg-emerald-950/50" },
                ].map((step) => (
                  <button
                    key={step.status}
                    onClick={() => setIncidentStatus(step.status)}
                    className={`w-full text-left p-3 border ${step.color} bg-[#0A0E17] text-xs font-mono transition-colors`}
                  >
                    <p className="text-[10px] text-stone-500 uppercase">{step.status}</p>
                    <p className="font-bold text-white mt-0.5">{step.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
