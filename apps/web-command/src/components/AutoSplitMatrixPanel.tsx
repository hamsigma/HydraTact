"use client";

import React from "react";
import {
  DEFAULT_TACTICAL_UNITS,
  DEFAULT_ACTIVE_BARRICADES,
  type TacticalUnitMatrixItem,
  type ActiveBarricadeItem,
} from "../lib/tactical-units";

export {
  DEFAULT_TACTICAL_UNITS,
  DEFAULT_ACTIVE_BARRICADES,
  type TacticalUnitMatrixItem,
  type ActiveBarricadeItem,
};

export interface AutoSplitMatrixPanelProps {
  gangWidthMeters?: number;
  units?: TacticalUnitMatrixItem[];
  barricades?: ActiveBarricadeItem[];
  onToggleBarricade?: (id: string, currentActive: boolean) => void;
  className?: string;
}

export const AutoSplitMatrixPanel: React.FC<AutoSplitMatrixPanelProps> = ({
  gangWidthMeters = 2.1,
  units = DEFAULT_TACTICAL_UNITS,
  barricades = DEFAULT_ACTIVE_BARRICADES,
  onToggleBarricade,
  className = "",
}) => {
  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Parameter Geometris Gang & Aturan Auto-Split */}
      <div className="p-3 bg-[#0A0E17] border border-stone-800 text-xs font-mono">
        <div className="flex items-center justify-between mb-2">
          <span className="text-stone-400">LEBAR GANG TERUKUR:</span>
          <span className="font-bold text-amber-400 tabular-nums">
            {gangWidthMeters.toFixed(1)} METER (&lt; 2.5M)
          </span>
        </div>
        <p className="text-[11px] text-stone-300 leading-relaxed">
          Protokol Auto-Split aktif: Unit kapasitas &lt; 1000L masuk ke gang sebagai{" "}
          <strong className="text-cyan-400">ATTACKER</strong>. Unit &ge; 3000L standby di jalan utama sebagai{" "}
          <strong className="text-amber-400">FEEDER</strong> penyuplai selang.
        </p>
      </div>

      {/* Matriks Unit Pemadam */}
      <div>
        <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase mb-2">
          MATRIKS PERAN ARMADA TAKTIS
        </p>
        <div className="space-y-2">
          {units.map((unit) => {
            const isAttacker = unit.assignedRole === "ATTACKER";
            return (
              <div
                key={unit.id}
                className="p-3 bg-[#080B10] border border-stone-800 text-xs font-mono"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white tracking-wider">{unit.callSign}</span>
                  <span
                    className={`font-bold tracking-widest uppercase ${
                      isAttacker ? "text-cyan-400" : "text-amber-400"
                    }`}
                  >
                    {unit.assignedRole}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400 pt-1 border-t border-stone-900">
                  <div>
                    <span>TANGKI: </span>
                    <span className="text-stone-200 font-bold tabular-nums">
                      {unit.tankCapacityLiters}L
                    </span>
                  </div>
                  <div>
                    <span>JARAK API: </span>
                    <span className="text-stone-200 font-bold tabular-nums">
                      {unit.distanceFromFireMeters}m
                    </span>
                  </div>
                  <div>
                    <span>TEKANAN: </span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {unit.waterPressureBar} BAR
                    </span>
                  </div>
                  <div>
                    <span>STATUS: </span>
                    <span className="text-stone-300 font-bold">{unit.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lapisan Barikade Selang Jalan Fuchsia */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-mono font-bold tracking-widest text-fuchsia-400 uppercase">
            BARIKADE SELANG RELAY FUCHSIA (#D946EF)
          </p>
          <span className="text-[10px] font-mono text-stone-400 tabular-nums">
            {barricades.filter((b) => b.isActive).length} AKTIF
          </span>
        </div>

        <div className="space-y-2">
          {barricades.map((barricade) => (
            <div
              key={barricade.id}
              className={`p-3 text-xs font-mono border transition-colors ${
                barricade.isActive
                  ? "bg-fuchsia-950/20 border-fuchsia-800/80"
                  : "bg-stone-950 border-stone-800 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-fuchsia-300">{barricade.roadName}</span>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    barricade.isActive ? "text-emerald-400" : "text-stone-500"
                  }`}
                >
                  {barricade.isActive ? "TERPASANG (4PX)" : "DINONAKTIFKAN"}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
                <span>DIBENTANGKAN: {barricade.feederCallSign}</span>
                <span className="font-bold text-stone-300 tabular-nums">
                  {barricade.hoseLengthMeters} METER
                </span>
              </div>

              {onToggleBarricade && (
                <button
                  onClick={() => onToggleBarricade(barricade.id, barricade.isActive)}
                  className={`mt-2 w-full py-1 text-[10px] font-mono font-bold uppercase border transition-colors ${
                    barricade.isActive
                      ? "border-red-800 text-red-300 hover:bg-red-950/50"
                      : "border-emerald-800 text-emerald-300 hover:bg-emerald-950/50"
                  }`}
                >
                  {barricade.isActive ? "Lepas Barikade Jalan" : "Pasang Barikade Ulang"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
