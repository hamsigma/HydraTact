"use client";

import React from "react";
import type { TelemetryMutationItem } from "../lib/telemetry";

export interface TelemetryStreamPanelProps {
  mutations?: TelemetryMutationItem[];
  className?: string;
}

export const TelemetryStreamPanel: React.FC<TelemetryStreamPanelProps> = ({
  mutations = [],
  className = "",
}) => {
  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
        <p className="text-xs font-mono font-bold tracking-widest text-sky-700 uppercase">
          STREAM TELEMETRI KRONOLOGIS
        </p>
        <span className="text-[10px] font-mono text-slate-500 tabular-nums">
          {mutations.length} MUTASI
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
        {mutations.map((item) => {
          const typeColor =
            item.actionType === "PRESSURE_REQUEST"
              ? "text-sky-700"
              : item.actionType === "HOSE_DEPLOYED"
              ? "text-fuchsia-700"
              : item.actionType === "HYDRANT_STATUS_UPDATE"
              ? "text-emerald-700"
              : "text-amber-700";

          return (
            <div
              key={item.id}
              className="p-2.5 bg-[#F8F9FA] border border-[#E2E8F0] text-xs font-mono text-left shadow-sm"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={`font-bold ${typeColor}`}>{item.callSign}</span>
                <span className="text-slate-500 tabular-nums">{item.timestamp}</span>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                {item.description}
              </p>

              {item.pressureBar !== undefined && (
                <div className="mt-1.5 flex items-center justify-between text-[10px] pt-1 border-t border-slate-200">
                  <span className="text-slate-500">TARGET TEKANAN:</span>
                  <span className="text-sky-700 font-bold tabular-nums">
                    {item.pressureBar.toFixed(1)} BAR
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
