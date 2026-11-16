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
  onAdjustPressure?: (unitId: string, newTargetBar: number) => void;
  className?: string;
}

export const AutoSplitMatrixPanel: React.FC<AutoSplitMatrixPanelProps> = ({
  gangWidthMeters = 2.1,
  units = DEFAULT_TACTICAL_UNITS,
  barricades = DEFAULT_ACTIVE_BARRICADES,
  onToggleBarricade,
  onAdjustPressure,
  className = "",
}) => {
  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Parameter Geometris Gang & Aturan Auto-Split */}
      <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] text-xs font-mono">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500">LEBAR GANG TERUKUR:</span>
          <span className="font-bold text-amber-700 tabular-nums">
            {gangWidthMeters.toFixed(1)} METER (&lt; 2.5M)
          </span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Protokol Auto-Split aktif: Unit kapasitas &lt; 1000L masuk ke gang sebagai{" "}
          <strong className="text-sky-700">ATTACKER</strong>. Unit &ge; 3000L standby di jalan utama sebagai{" "}
          <strong className="text-amber-700">FEEDER</strong> penyuplai selang.
        </p>
      </div>

      {/* Matriks Unit Pemadam */}
      <div>
        <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-2">
          MATRIKS PERAN ARMADA TAKTIS
        </p>
        <div className="space-y-2">
          {units.map((unit) => {
            const isAttacker = unit.assignedRole === "ATTACKER";
            return (
              <div
                key={unit.id}
                className="p-3 bg-[#FFFFFF] border border-[#E2E8F0] text-xs font-mono shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 tracking-wider">{unit.callSign}</span>
                  <span
                    className={`font-bold tracking-widest uppercase ${
                      isAttacker ? "text-sky-700" : "text-amber-700"
                    }`}
                  >
                    {unit.assignedRole}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                  <div>
                    <span>TANGKI: </span>
                    <span className="text-slate-900 font-bold tabular-nums">
                      {unit.tankCapacityLiters}L
                    </span>
                  </div>
                  <div>
                    <span>JARAK API: </span>
                    <span className="text-slate-900 font-bold tabular-nums">
                      {unit.distanceFromFireMeters}m
                    </span>
                  </div>
                  <div>
                    <span>TEKANAN: </span>
                    <span className="text-emerald-700 font-bold tabular-nums">
                      {unit.waterPressureBar.toFixed(1)} BAR
                    </span>
                  </div>
                  <div>
                    <span>STATUS: </span>
                    <span className="text-slate-800 font-bold">{unit.status}</span>
                  </div>
                </div>

                {/* Kontrol Interaksi Tekanan Pompa Dua Arah */}
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                    <span>TARGET NOZZLE: <strong className="text-slate-800">{unit.targetPressureBar.toFixed(1)} BAR</strong></span>
                    <span className="tabular-nums">RENTANG AMAN: 4.0 - 14.0 BAR</span>
                  </div>
                  {onAdjustPressure && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAdjustPressure(unit.id, Math.max(0, +(unit.targetPressureBar - 1).toFixed(1)))}
                        className="flex-1 py-1 px-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-mono text-[10px] font-bold uppercase transition-colors"
                      >
                        -1 BAR
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjustPressure(unit.id, Math.min(16, +(unit.targetPressureBar + 1).toFixed(1)))}
                        className="flex-1 py-1 px-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-mono text-[10px] font-bold uppercase transition-colors"
                      >
                        +1 BAR
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjustPressure(unit.id, 0)}
                        className="py-1 px-2 border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 font-mono text-[10px] font-bold uppercase transition-colors"
                      >
                        CUT-OFF (0 BAR)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lapisan Barikade Selang Jalan Fuchsia */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-mono font-bold tracking-widest text-fuchsia-700 uppercase">
            BARIKADE SELANG RELAY (#C026D3)
          </p>
          <span className="text-[10px] font-mono text-slate-500 tabular-nums">
            {barricades.filter((b) => b.isActive).length} AKTIF
          </span>
        </div>

        <div className="space-y-2">
          {barricades.length === 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500 rounded-lg">
              <p className="font-bold text-slate-700 mb-0.5">NIHIL TITIK API AKTIF</p>
              <p className="text-[11px] text-slate-500">
                Barikade selang relay tidak diperlukan. Sektor dalam kondisi siaga hijau.
              </p>
            </div>
          ) : (
            barricades.map((barricade) => (
              <div
                key={barricade.id}
                className={`p-3 text-xs font-mono border transition-colors shadow-sm ${
                  barricade.isActive
                    ? "bg-fuchsia-50/40 border-fuchsia-300"
                    : "bg-slate-50 border-slate-200 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-fuchsia-900">{barricade.roadName}</span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      barricade.isActive ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {barricade.isActive ? "SELANG TERPASANG" : "DINONAKTIFKAN"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                  <span>DIBENTANGKAN: {barricade.feederCallSign}</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {barricade.hoseLengthMeters} METER
                  </span>
                </div>

                {onToggleBarricade && (
                  <button
                    type="button"
                    onClick={() => onToggleBarricade(barricade.id, barricade.isActive)}
                    className={`mt-2.5 w-full min-h-[48px] px-3 py-2 text-xs font-mono font-bold uppercase border transition-all cursor-pointer active:scale-[0.99] focus:outline-none focus:ring-2 ${
                      barricade.isActive
                        ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500"
                        : "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800 hover:bg-fuchsia-100 focus:ring-fuchsia-400"
                    }`}
                  >
                    {barricade.isActive
                      ? "LEPAS BARIKADE SELANG JALAN"
                      : "AKTIFKAN BARIKADE SELANG (BENTANG)"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
