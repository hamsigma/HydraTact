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
  // Icons8 iOS Family Icons (matching screenshot exactly)
  const menuItems: { id: SidebarTab; label: string; hasNotification?: boolean; icon: React.ReactNode }[] = [
    {
      id: "COMMAND",
      label: "KOMANDO TAKTIS",
      hasNotification: activeIncidentsCount > 0,
      icon: (
        // Icons8 iOS: 2x2 Circle Ring Grid
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="7" cy="7" r="3.2" />
          <circle cx="17" cy="7" r="3.2" />
          <circle cx="7" cy="17" r="3.2" />
          <circle cx="17" cy="17" r="3.2" />
        </svg>
      ),
    },
    {
      id: "UNITS",
      label: "MATRIKS ARMADA",
      hasNotification: activeBarricadesCount > 0,
      icon: (
        // Icons8 iOS: Tactical Fleet Truck (Armada Pemadam)
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="2" y="5" width="12" height="10" rx="1.5" />
          <path d="M14 8h4.5l2.5 3.5V15h-7V8z" />
          <circle cx="6" cy="17.5" r="2" />
          <circle cx="17.5" cy="17.5" r="2" />
          <path d="M5 9h6" />
        </svg>
      ),
    },
    {
      id: "HYDRANTS",
      label: "DIREKTORI AIR",
      icon: (
        // Icons8 iOS: Water Droplet (Logistik Air & Hidran)
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 2.5C12 2.5 5.5 10 5.5 15C5.5 18.59 8.41 21.5 12 21.5C15.59 21.5 18.5 18.59 18.5 15C18.5 10 12 2.5 12 2.5Z" />
          <path d="M9 15a3 3 0 003 3" />
        </svg>
      ),
    },
    {
      id: "TELEMETRY",
      label: "LOG TELEMETRI",
      icon: (
        // Icons8 iOS: Activity Pulse Waveform (Telemetri Realtime)
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M2 12h4l3-8 4 16 3-8h6" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      aria-label="Navigasi Menu Utama Posko"
      className={`w-[76px] bg-[#121316] flex flex-col items-center justify-between py-6 shrink-0 select-none z-30 ${className}`}
    >
      {/* Vertical Nav Icons (Icons8 iOS Style) */}
      <nav className="flex flex-col items-center space-y-3.5">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-all cursor-pointer relative ${
                  isActive
                    ? "bg-[#27282D] text-white shadow-sm ring-1 ring-white/10"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {item.icon}

                {/* Red Circle Notification Dot (matching uploaded image) */}
                {item.hasNotification && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-[#121316]" />
                )}
              </button>

              {/* Floating Tooltip Label */}
              <div className="absolute left-16 bg-[#18181B] text-white text-xs font-mono font-bold tracking-wider px-2.5 py-1.5 rounded-lg shadow-xl border border-zinc-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Exit / Logout Button (Icons8 iOS Exit) */}
      <div className="relative group flex items-center justify-center">
        <button
          type="button"
          title="Keluar / Status Posko"
          className="w-12 h-12 rounded-[18px] flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
        <div className="absolute left-16 bg-[#18181B] text-zinc-300 text-[11px] font-mono px-2.5 py-1.5 rounded-lg shadow-xl border border-zinc-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          LOGOUT / POSKO SAMARINDA
        </div>
      </div>
    </aside>
  );
};
