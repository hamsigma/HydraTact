"use client";

import React, { useState } from "react";
import { TacticalMapCanvas } from "../components/TacticalMapCanvas";

export default function WebCommandDashboard() {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    "33333333-3333-3333-3333-333333333301"
  );
  const [incidentStatus, setIncidentStatus] = useState<string>("VERIFIED");

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

          {/* Ringkasan Disposisi Armada */}
          <div className="p-4 flex-1">
            <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase mb-3">
              DISPOSISI ARMADA RELAWAN
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-[#0A0E17] border border-stone-800 text-xs font-mono">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-white">UNIT BALAKARCANA 01</span>
                  <span className="text-cyan-400 font-bold">ATTACKER</span>
                </div>
                <p className="text-stone-400 text-[11px]">
                  Truk Tangki 800L • Masuk Gg. 4 (Lebar 2.1m)
                </p>
                <p className="text-stone-500 text-[10px] mt-1 tabular-nums">
                  TEKANAN NOZZLE: 6.8 BAR
                </p>
              </div>

              <div className="p-3 bg-[#0A0E17] border border-stone-800 text-xs font-mono">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-white">UNIT TANGKI INDUK 05</span>
                  <span className="text-amber-400 font-bold">FEEDER</span>
                </div>
                <p className="text-stone-400 text-[11px]">
                  Tangki 5000L • Standby di Mulut Jl. Pelita
                </p>
                <p className="text-stone-500 text-[10px] mt-1 tabular-nums">
                  RELAY SELANG: 110M MENUJU UNIT 01
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* KOLOM TENGAH (Kanvas Peta Taktis Leaflet Layar Penuh) */}
        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#05070A]">
          <TacticalMapCanvas
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={setSelectedIncidentId}
            className="flex-1"
          />
        </main>

        {/* KOLOM KANAN (Barikade Ruas Jalan, Telemetri, Kontrol FSM) */}
        <aside className="w-88 border-l border-stone-800 bg-[#080B10] flex flex-col shrink-0 overflow-y-auto">
          {/* Header Panel Kanan */}
          <div className="p-4 border-b border-stone-800">
            <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase mb-1">
              KENDALI TAKTIS OPERATOR
            </p>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              BARIKADE & PROTOKOL FSM
            </h2>
          </div>

          {/* Barikade Selang Jalan Aktif */}
          <div className="p-4 border-b border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono font-bold tracking-widest text-fuchsia-400 uppercase">
                BARIKADE SELANG AKTIF
              </p>
              <span className="text-[10px] font-mono text-stone-400 tabular-nums">1 TITIK</span>
            </div>
            <div className="p-3 bg-fuchsia-950/20 border border-fuchsia-800/60 text-xs font-mono">
              <p className="font-bold text-fuchsia-200">MULUT JL. PELITA GG. 4</p>
              <p className="text-stone-400 text-[11px] mt-1">
                ALASAN: SELANG BERTEKANAN TINGGI (110M)
              </p>
              <div className="mt-2 flex justify-between items-center text-[10px] text-stone-500">
                <span>DIBUAT OLEH: FEEDER 05</span>
                <span className="text-emerald-400 font-bold">TERPASANG</span>
              </div>
            </div>
          </div>

          {/* Kontrol Transisi Status FSM Insiden */}
          <div className="p-4 flex-1">
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
        </aside>
      </div>
    </div>
  );
}
