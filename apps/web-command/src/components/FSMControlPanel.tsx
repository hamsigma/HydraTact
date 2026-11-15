"use client";

import React, { useState } from "react";

export interface FSMControlPanelProps {
  currentStatus: string;
  incidentId: string;
  onExecuteTransition: (targetStatus: string, isOverride?: boolean) => Promise<void> | void;
  className?: string;
}

export const FSMControlPanel: React.FC<FSMControlPanelProps> = ({
  currentStatus,
  incidentId,
  onExecuteTransition,
  className = "",
}) => {
  const [pendingAction, setPendingAction] = useState<{
    targetStatus: string;
    label: string;
    isOverride?: boolean;
    description: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setIsProcessing(true);
    try {
      await onExecuteTransition(pendingAction.targetStatus, pendingAction.isOverride);
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-stone-800">
        <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase">
          KENDALI PROTOKOL FSM POSKO
        </p>
        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
          {currentStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Tombol 1: VERIFIKASI PAKSA (Commander Override) */}
        <button
          onClick={() =>
            setPendingAction({
              targetStatus: "VERIFIED",
              label: "VERIFIKASI PAKSA (OVERRIDE)",
              isOverride: true,
              description: "Mengabaikan kuorum 2 pelapor dan langsung memvalidasi insiden secara otoritatif.",
            })
          }
          className="p-2.5 border border-red-800/80 bg-red-950/20 hover:bg-red-950/40 text-red-300 font-bold text-left transition-colors"
        >
          <span className="block text-[10px] text-red-400">OTORITAS POSKO</span>
          VERIFIKASI PAKSA
        </button>

        {/* Tombol 2: DISPATCH ARMADA */}
        <button
          onClick={() =>
            setPendingAction({
              targetStatus: "DISPATCHED",
              label: "KERAHKAN ARMADA (DISPATCH)",
              description: "Menginstruksikan seluruh unit posko dan relawan terdekat meluncur ke lokasi insiden.",
            })
          }
          className="p-2.5 border border-cyan-800/80 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 font-bold text-left transition-colors"
        >
          <span className="block text-[10px] text-cyan-400">INSTRUKSI JALAN</span>
          DISPATCH
        </button>

        {/* Tombol 3: PENDINGINAN (CONTROLLED) */}
        <button
          onClick={() =>
            setPendingAction({
              targetStatus: "CONTROLLED",
              label: "PENDINGINAN (CONTROLLED)",
              description: "Menandai bahwa api utama telah padam dan fase pendinginan titik bara sedang berlangsung.",
            })
          }
          className="p-2.5 border border-amber-800/80 bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 font-bold text-left transition-colors"
        >
          <span className="block text-[10px] text-amber-400">FASE PENDINGINAN</span>
          PENDINGINAN
        </button>

        {/* Tombol 4: TUTUP INSIDEN (RESOLVED) */}
        <button
          onClick={() =>
            setPendingAction({
              targetStatus: "RESOLVED",
              label: "TUTUP INSIDEN (RESOLVED)",
              description: "Mengakhiri status darurat insiden, membongkar selang, dan memulihkan armada ke posko.",
            })
          }
          className="p-2.5 border border-emerald-800/80 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-300 font-bold text-left transition-colors"
        >
          <span className="block text-[10px] text-emerald-400">SELESAI OPERASI</span>
          TUTUP INSIDEN
        </button>
      </div>

      {/* Modal Dialog Konfirmasi Taktis */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0E17] border border-stone-700 max-w-sm w-full p-5 text-left font-mono">
            <p className="text-xs font-bold text-red-400 tracking-widest uppercase mb-1">
              KONFIRMASI EKSEKUSI TAKTIS
            </p>
            <h3 className="text-base font-bold text-white mb-2">
              {pendingAction.label}
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              {pendingAction.description}
            </p>

            <div className="text-[11px] text-stone-400 bg-stone-950 p-2.5 border border-stone-850 mb-4">
              <span>TARGET INSIDEN: </span>
              <span className="text-white font-bold">{incidentId.slice(0, 8)}...</span>
            </div>

            <div className="flex gap-2">
              <button
                disabled={isProcessing}
                onClick={() => setPendingAction(null)}
                className="flex-1 py-2 text-xs font-bold border border-stone-700 text-stone-300 hover:bg-stone-900 transition-colors"
              >
                BATAL
              </button>
              <button
                disabled={isProcessing}
                onClick={handleConfirm}
                className="flex-1 py-2 text-xs font-bold bg-red-700 hover:bg-red-600 text-white transition-colors"
              >
                {isProcessing ? "MEMPROSES..." : "EKSEKUSI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
