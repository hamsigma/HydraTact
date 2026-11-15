"use client";

import React, { useState } from "react";
import {
  DEFAULT_SAMARINDA_WATER_SOURCES,
  type WaterSourcePoint,
  type ActiveIncidentMarker,
} from "../lib/water-sources.ts";
import type { ActiveBarricadeItem } from "../lib/tactical-units.ts";

export { DEFAULT_SAMARINDA_WATER_SOURCES, type WaterSourcePoint, type ActiveIncidentMarker };

export interface TacticalMapCanvasProps {
  incidents?: ActiveIncidentMarker[];
  waterSources?: WaterSourcePoint[];
  barricades?: ActiveBarricadeItem[];
  skmTideLevelMeters?: number;
  isHighTide?: boolean;
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
  className?: string;
}

export const TacticalMapCanvas: React.FC<TacticalMapCanvasProps> = ({
  incidents = [
    {
      id: "33333333-3333-3333-3333-333333333301",
      name: "Gg. 4 Pelita (Titik Api Aktif)",
      coordinates: [-0.5021, 117.1536],
      status: "VERIFIED",
      reportersCount: 2,
    },
  ],
  waterSources = DEFAULT_SAMARINDA_WATER_SOURCES,
  barricades = [
    {
      id: "barricade-01",
      roadName: "Mulut Jl. Pelita Gg. 4",
      feederCallSign: "UNIT TANGKI INDUK 05",
      hoseLengthMeters: 110,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  skmTideLevelMeters = 1.8,
  isHighTide = true,
  selectedIncidentId = "33333333-3333-3333-3333-333333333301",
  onSelectIncident,
  className = "",
}) => {
  const [activeFilter, setActiveFilter] = useState<"ALL" | "READY" | "LOW" | "EMPTY">("ALL");

  const filteredSources = waterSources.filter((ws) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "READY") return ws.status === "READY";
    if (activeFilter === "LOW") return ws.status === "LOW_DISCHARGE";
    if (activeFilter === "EMPTY") return ws.status === "EMPTY";
    return true;
  });

  const activeBarricades = barricades.filter((b) => b.isActive);

  return (
    <div
      data-testid="tactical-map-canvas"
      className={`relative w-full h-full min-h-[500px] bg-[#07090E] border border-stone-800 overflow-hidden flex flex-col ${className}`}
    >
      {/* HUD Bar Atas Peta */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 bg-[#07090E]/90 backdrop-blur-md border border-stone-800 p-3">
        <div>
          <p className="text-[10px] font-mono font-bold tracking-widest text-stone-400 uppercase">
            KANVAS TAKTIS SAMARINDA • WGS 84
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 bg-red-500 animate-ping inline-block" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {incidents.length} INSIDEN KEBAKARAN AKTIF
            </span>
          </div>
        </div>

        {/* Indikator Pasang Surut Sungai Karang Mumus (SKM) */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-stone-400 block text-[10px]">SUNGAI KARANG MUMUS:</span>
            <span
              className={`font-bold tabular-nums ${
                isHighTide ? "text-cyan-400" : "text-amber-400"
              }`}
            >
              {isHighTide ? "PASANG" : "SURUT"} (+{skmTideLevelMeters.toFixed(1)}M)
            </span>
          </div>

          <div className="h-6 w-px bg-stone-800" />

          {/* Filter Status Sumber Air */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-stone-500 uppercase mr-1">FILTER:</span>
            {(["ALL", "READY", "LOW", "EMPTY"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveFilter(mode)}
                className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors ${
                  activeFilter === mode
                    ? "bg-stone-800 text-white border border-stone-600"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Canvas Rendering (Dark Leaflet Grid Simulator) */}
      <div className="relative flex-1 w-full h-full bg-[#05070A] overflow-hidden flex items-center justify-center">
        {/* Kisi Grid Taktis Koordinat */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141923_1px,transparent_1px),linear-gradient(to_bottom,#141923_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />

        {/* Lapisan Garis Sungai Karang Mumus & Barikade Selang Fuchsia */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 800"
          preserveAspectRatio="none"
        >
          {/* Alur Sungai Karang Mumus meliuk membelah Samarinda */}
          <path
            d="M 120 780 C 220 620, 280 500, 390 410 C 480 340, 560 280, 680 180 C 760 110, 850 60, 950 10"
            fill="none"
            stroke="#0891b2"
            strokeWidth="14"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />
          <path
            d="M 120 780 C 220 620, 280 500, 390 410 C 480 340, 560 280, 680 180 C 760 110, 850 60, 950 10"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeOpacity="0.8"
            strokeDasharray="8 4"
          />

          {/* Garis Barikade Selang Fuchsia (#D946EF, tebal 4px) dari Feeder (jalan raya) ke Attacker (gang) */}
          {activeBarricades.map((_barricade, index) => (
            <g key={_barricade.id || index}>
              {/* Efek glow garis fuchsia */}
              <line
                x1="420"
                y1="510"
                x2="540"
                y2="480"
                stroke="#D946EF"
                strokeWidth="8"
                strokeOpacity="0.3"
                strokeLinecap="round"
              />
              {/* Garis inti fuchsia 4px */}
              <line
                x1="420"
                y1="510"
                x2="540"
                y2="480"
                stroke="#D946EF"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Titik penanda barikade jalan ditutup */}
              <circle cx="420" cy="510" r="5" fill="#D946EF" />
              <text
                x="410"
                y="530"
                fill="#F0ABFC"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
              >
                BARIKADE SELANG ({_barricade.hoseLengthMeters}M)
              </text>
            </g>
          ))}
        </svg>

        {/* Titik-Titik Sumber Air (Water Sources) */}
        <div className="absolute inset-0 pointer-events-none">
          {filteredSources.map((ws, idx) => {
            const leftPct = 15 + ((idx * 29) % 70);
            const topPct = 20 + ((idx * 23) % 65);

            const statusColor =
              ws.status === "READY"
                ? "bg-emerald-500 border-emerald-300"
                : ws.status === "LOW_DISCHARGE"
                ? "bg-amber-500 border-amber-300"
                : "bg-stone-600 border-stone-400";

            return (
              <div
                key={ws.id}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer"
                title={`${ws.name} (${ws.status}) - ${ws.dischargeLitersPerMin} L/min`}
              >
                <div className={`w-2.5 h-2.5 border ${statusColor}`} />
                <div className="hidden group-hover:block absolute left-4 top-0 z-20 bg-[#07090E] border border-stone-700 p-2 text-left whitespace-nowrap shadow-xl">
                  <p className="text-[10px] font-mono font-bold text-white">{ws.name}</p>
                  <p className="text-[10px] font-mono text-stone-400">
                    DEBIT: {ws.dischargeLitersPerMin} L/MIN • STATUS: {ws.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Titik Api Aktif Berdenyut (Active Incident Pulsing Marker) */}
        {incidents.map((inc) => {
          const isSelected = inc.id === selectedIncidentId;
          return (
            <div
              key={inc.id}
              onClick={() => onSelectIncident?.(inc.id)}
              style={{ left: "54%", top: "48%" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
            >
              {/* Gelombang Denyut Merah Lingkaran Taktis */}
              <div className="absolute -inset-4 bg-red-600/30 rounded-full animate-ping pointer-events-none" />
              <div className="absolute -inset-2 bg-red-600/50 rounded-full animate-pulse pointer-events-none" />

              {/* Titik Pusat Api */}
              <div
                className={`relative w-5 h-5 bg-red-600 border-2 ${
                  isSelected ? "border-white" : "border-red-400"
                } flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.8)]`}
              >
                <span className="w-1.5 h-1.5 bg-white" />
              </div>

              {/* Label Monospace Lokasi Insiden */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-[#07090E]/95 border border-red-700 px-2.5 py-1 text-left whitespace-nowrap">
                <p className="text-xs font-mono font-bold text-red-400 tracking-wider">
                  {inc.name}
                </p>
                <p className="text-[10px] font-mono text-stone-300 tabular-nums">
                  STATUS: {inc.status} • {inc.reportersCount} LAPORAN TERVERIFIKASI
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Status Bar Bawah */}
      <div className="z-10 bg-[#07090E] border-t border-stone-800 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-stone-400">
        <div>
          KOORDINAT POSKO: <span className="text-stone-200 tabular-nums">-0.5021° S, 117.1536° E</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">● {waterSources.filter(s => s.status === "READY").length} READY</span>
          <span className="text-amber-400">● {waterSources.filter(s => s.status === "LOW_DISCHARGE").length} LOW</span>
          <span className="text-stone-500">● {waterSources.filter(s => s.status === "EMPTY").length} EMPTY</span>
          <span className="text-fuchsia-400">● {activeBarricades.length} BARIKADE FUCHSIA</span>
        </div>
      </div>
    </div>
  );
};
