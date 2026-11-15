"use client";

import React from "react";

export type SidebarTab = "COMMAND" | "UNITS" | "HYDRANTS" | "TELEMETRY";

export interface TacticalSidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  activeIncidentsCount?: number;
  activeBarricadesCount?: number;
  className?: string;
}

export const TacticalSidebar: React.FC<TacticalSidebarProps> = ({
  activeTab,
  onSelectTab,
  activeIncidentsCount = 1,
  activeBarricadesCount = 1,
  className = "",
}) => {
  const menuItems: { id: SidebarTab; label: string; badge?: string; icon: React.ReactNode }[] = [
    {
      id: "COMMAND",
      label: "KOMANDO TAKTIS",
      badge: activeIncidentsCount > 0 ? `${activeIncidentsCount} AKTIF` : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
    },
    {
      id: "UNITS",
      label: "MATRIKS ARMADA",
      badge: `${activeBarricadesCount} SELANG`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
    },
    {
      id: "HYDRANTS",
      label: "DIREKTORI AIR",
      badge: "30+ TITIK",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
    },
    {
      id: "TELEMETRY",
      label: "LOG TELEMETRI",
      badge: "REALTIME",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside
      aria-label="Navigasi Menu Utama Posko"
      className={`w-64 bg-[#FFFFFF] border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 select-none z-30 ${className}`}
    >
      {/* Brand & Sector Header */}
      <div>
        <div className="h-14 px-4 border-b border-[#E2E8F0] flex items-center gap-3 bg-[#F8F9FA]">
          <div className="w-7 h-7 bg-red-600 flex items-center justify-center text-white font-bold text-xs font-mono">
            HT
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
              HYDRATACT POSKO
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">
              SAMARINDA • LIGHT OPS
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1">
          <p className="px-3 py-2 text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase">
            MENU OPERASIONAL
          </p>

          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full min-h-[48px] px-3 py-2.5 flex items-center justify-between text-xs font-mono font-bold transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                  isActive
                    ? "bg-slate-100 text-slate-900 border-l-3 border-red-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-3 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-red-600" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span className="tracking-wider">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 border ${
                      isActive
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Telemetry Status */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8F9FA] space-y-2 text-[11px] font-mono">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">CDC SUPABASE:</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-600" /> TERHUBUNG
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">POSTGIS LATENSI:</span>
          <span className="text-slate-800 font-bold tabular-nums">1.2ms</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-400">
          <span>MODE: LIGHT SYSTEM</span>
          <span>v2.0.0</span>
        </div>
      </div>
    </aside>
  );
};
