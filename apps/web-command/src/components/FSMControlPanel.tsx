"use client";

import React, { useState, useEffect, useCallback } from "react";

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

  const handleConfirm = useCallback(async () => {
    if (!pendingAction) return;
    setIsProcessing(true);
    try {
      await onExecuteTransition(pendingAction.targetStatus, pendingAction.isOverride);
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  }, [pendingAction, onExecuteTransition]);

  // Keyboard accessibility: Escape to cancel, Enter to confirm
  useEffect(() => {
    if (!pendingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPendingAction(null);
      } else if (e.key === "Enter" && !isProcessing) {
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingAction, isProcessing, handleConfirm]);

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-stone-800">
        <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase">
          KENDALI PROTOKOL FSM POSKO
        </p>
        <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
          {currentStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Tombol 1: VERIFIKASI PAKSA (Commander Override) - Apple HIG min-h-[52px] */}
        <button
          type="button"
          onClick={() =>
            setPendingAction({
              targetStatus: "VERIFIED",
              label: "VERIFIKASI PAKSA (OVERRIDE)",
              isOverride: true,
              description: "Mengabaikan kuorum 2 pelapor dan langsung memvalidasi insiden secara otoritatif.",
            })
          }
          className="min-h-[52px] p-2.5 border border-red-800/80 bg-red-950/20 hover:bg-red-950/40 text-red-300 font-bold text-left transition-all cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <span className="block text-[10px] text-red-400 font-normal">OTORITAS POSKO</span>
          VERIFIKASI PAKSA
        </button>

        {/* Tombol 2: DISPATCH ARMADA - Apple HIG min-h-[52px] */}
        <button
          type="button"
          onClick={() =>
            setPendingAction({
              targetStatus: "DISPATCHED",
              label: "KERAHKAN ARMADA (DISPATCH)",
              description: "Menginstruksikan seluruh unit posko dan relawan terdekat meluncur ke lokasi insiden.",
            })
          }
          className="min-h-[52px] p-2.5 border border-cyan-800/80 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 font-bold text-left transition-all cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <span className="block text-[10px] text-cyan-400 font-normal">INSTRUKSI JALAN</span>
          DISPATCH
        </button>

        {/* Tombol 3: PENDINGINAN (CONTROLLED) - Apple HIG min-h-[52px] */}
        <button
          type="button"
          onClick={() =>
            setPendingAction({
              targetStatus: "CONTROLLED",
              label: "PENDINGINAN (CONTROLLED)",
              description: "Menandai bahwa api utama telah padam dan fase pendinginan titik bara sedang berlangsung.",
            })
          }
          className="min-h-[52px] p-2.5 border border-amber-800/80 bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 font-bold text-left transition-all cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <span className="block text-[10px] text-amber-400 font-normal">FASE PENDINGINAN</span>
          PENDINGINAN
        </button>

        {/* Tombol 4: TUTUP INSIDEN (RESOLVED) - Apple HIG min-h-[52px] */}
        <button
          type="button"
          onClick={() =>
            setPendingAction({
              targetStatus: "RESOLVED",
              label: "TUTUP INSIDEN (RESOLVED)",
              description: "Mengakhiri status darurat insiden, membongkar selang, dan memulihkan armada ke posko.",
            })
          }
          className="min-h-[52px] p-2.5 border border-emerald-800/80 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-300 font-bold text-left transition-all cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <span className="block text-[10px] text-emerald-400 font-normal">SELESAI OPERASI</span>
          TUTUP INSIDEN
        </button>
      </div>

      {/* Modal Dialog Konfirmasi Taktis FSM (Docs/Design.md §5.4) */}
      {pendingAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fsm-dialog-title"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#0A0E17] border border-stone-700 max-w-sm w-full p-5 text-left font-mono shadow-2xl">
            <p className="text-xs font-bold text-red-400 tracking-widest uppercase mb-1">
              KONFIRMASI EKSEKUSI TAKTIS
            </p>
            <h3 id="fsm-dialog-title" className="text-base font-bold text-white mb-2">
              {pendingAction.label}
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              {pendingAction.description}
            </p>

            <div className="text-[11px] text-stone-400 bg-stone-950 p-2.5 border border-stone-850 mb-4">
              <span>TARGET INSIDEN: </span>
              <span className="text-white font-bold tracking-wider">{incidentId.slice(0, 8)}...</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPendingAction(null)}
                className="flex-1 min-h-[48px] py-2.5 text-xs font-bold border border-stone-700 text-stone-300 hover:bg-stone-900 transition-colors cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                BATAL [ESC]
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirm}
                className="flex-1 min-h-[48px] py-2.5 text-xs font-bold bg-red-700 hover:bg-red-600 text-white transition-colors cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isProcessing ? "MEMPROSES..." : "EKSEKUSI [ENTER]"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
