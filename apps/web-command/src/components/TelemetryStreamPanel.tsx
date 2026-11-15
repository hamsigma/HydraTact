"use client";

import React from "react";
import type { TelemetryMutationItem } from "../lib/telemetry.ts";

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
      <div className="flex items-center justify-between pb-2 border-b border-stone-800">
        <p className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
          STREAM TELEMETRI KRONOLOGIS
        </p>
        <span className="text-[10px] font-mono text-stone-500 tabular-nums">
          {mutations.length} MUTASI
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
        {mutations.map((item) => {
          const typeColor =
            item.actionType === "PRESSURE_REQUEST"
              ? "text-cyan-400"
              : item.actionType === "HOSE_DEPLOYED"
              ? "text-fuchsia-400"
              : item.actionType === "HYDRANT_STATUS_UPDATE"
              ? "text-emerald-400"
              : "text-amber-400";

          return (
            <div
              key={item.id}
              className="p-2.5 bg-[#080B10] border border-stone-850 text-xs font-mono text-left"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-stone-300">{item.callSign}</span>
                <span className="text-stone-500 tabular-nums">{item.timestamp}</span>
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed">
                {item.description}
              </p>

              {item.pressureBar !== undefined && (
                <div className="mt-1.5 flex items-center justify-between text-[10px] pt-1 border-t border-stone-900">
                  <span className="text-stone-500">TARGET TEKANAN:</span>
                  <span className="text-cyan-300 font-bold tabular-nums">
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
