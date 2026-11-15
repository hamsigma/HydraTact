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
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
        <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
          KENDALI PROTOKOL FSM POSKO
        </p>
        <span className="text-xs font-mono text-emerald-700 font-bold uppercase tracking-wider">
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
              description: "Validasi langsung tanpa menunggu kuorum 2 laporan warga.",
            })
          }
          className="min-h-[52px] p-2.5 border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-left transition-all cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <span className="block text-[10px] text-red-600 font-normal">OTORITAS POSKO</span>
          VERIFIKASI PAKSA
        </button>

        {/* Tombol 2: DISPATCH ARMADA - Apple HIG min-h-[52px] */}
        <button
          type="button"
          onClick={() =>
            setPendingAction({
              targetStatus: "DISPATCHED",
              label: "KERAHKAN ARMADA (DISPATCH)",
              description: "Instruksikan unit pemadam dan relawan terdekat meluncur ke lokasi.",
            })
          }
          className="min-h-[52px] p-2.5 border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-left transition-all cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <span className="block text-[10px] text-sky-600 font-normal">INSTRUKSI JALAN</span>
          DISPATCH
        </button>

        {/* Tombol 3: PENDINGINAN (CONTROLLED) - Apple HIG min-h-[52px] */}
        <button
          type="button"
          onClick={() =>
            setPendingAction({
              targetStatus: "CONTROLLED",
              label: "PENDINGINAN (CONTROLLED)",
              description: "Tandai api utama padam. Mulai penyemprotan bara dan isolasi rambatan.",
            })
          }
          className="min-h-[52px] p-2.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-left transition-all cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <span className="block text-[10px] text-amber-700 font-normal">FASE PENDINGINAN</span>
          PENDINGINAN
        </button>

        {/* Tombol 4: TUTUP INSIDEN (RESOLVED) - Apple HIG min-h-[52px] */}
        <button
          type="button"
          onClick={() =>
            setPendingAction({
              targetStatus: "RESOLVED",
              label: "TUTUP INSIDEN (RESOLVED)",
              description: "Operasi selesai. Bongkar selang dan tarik armada kembali ke pangkalan.",
            })
          }
          className="min-h-[52px] p-2.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-left transition-all cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <span className="block text-[10px] text-emerald-700 font-normal">SELESAI OPERASI</span>
          TUTUP INSIDEN
        </button>
      </div>

      {/* Modal Dialog Konfirmasi Taktis FSM (Docs/Design.md §5.4) */}
      {pendingAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fsm-dialog-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFFFF] border border-[#CBD5E1] max-w-sm w-full p-5 text-left font-mono shadow-2xl">
            <p className="text-xs font-bold text-red-600 tracking-widest uppercase mb-1">
              KONFIRMASI EKSEKUSI TAKTIS
            </p>
            <h3 id="fsm-dialog-title" className="text-base font-bold text-slate-900 mb-2">
              {pendingAction.label}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {pendingAction.description}
            </p>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 border border-slate-200 mb-4">
              <span>TARGET INSIDEN: </span>
              <span className="text-slate-900 font-bold tracking-wider">{incidentId.slice(0, 8)}...</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPendingAction(null)}
                className="flex-1 min-h-[48px] py-2.5 text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                BATAL [ESC]
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirm}
                className="flex-1 min-h-[48px] py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
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
