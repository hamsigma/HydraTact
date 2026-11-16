"use client";

import React, { useState, useEffect, useRef } from "react";
import { subscribeToIncidentRealtime, type IncidentRealtimeRow } from "../lib/supabase-realtime";
import { triggerHaptic } from "../utils/haptic";

export interface CitizenConsensusCardProps {
  incidentId: string;
  initialStatus: string;
  initialReportersCount: number;
  clusterRadiusMeters?: number;
  createdAt: string;
  onStatusChange?: (newStatus: string) => void;
}

export const CitizenConsensusCard: React.FC<CitizenConsensusCardProps> = ({
  incidentId,
  initialStatus,
  initialReportersCount,
  clusterRadiusMeters = 100.0,
  createdAt,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<string>(initialStatus);
  const [reportersCount, setReportersCount] = useState<number>(initialReportersCount);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180);
  const isVerifiedRef = useRef<boolean>(initialStatus !== "REPORTED");

  // Hitung mundur jendela konsensus 3 menit (180 detik)
  useEffect(() => {
    if (status !== "REPORTED") return;

    const startTimestamp = new Date(createdAt).getTime();
    const expiryTimestamp = startTimestamp + 180 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((expiryTimestamp - now) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [createdAt, status]);

  // Berlangganan Supabase Realtime CDC per Incident ID
  useEffect(() => {
    const sub = subscribeToIncidentRealtime(incidentId, {
      onIncidentUpdate: (payload) => {
        const updatedRow: IncidentRealtimeRow = payload.new;
        if (!updatedRow) return;

        if (updatedRow.status && updatedRow.status !== status) {
          setStatus(updatedRow.status);
          onStatusChange?.(updatedRow.status);

          // Getaran haptic ganda saat status berubah menjadi terverifikasi
          if (updatedRow.status !== "REPORTED" && !isVerifiedRef.current) {
            isVerifiedRef.current = true;
            triggerHaptic([120, 60, 200]);
          }
        }

        if (typeof updatedRow.verified_reporters_count === "number") {
          setReportersCount(updatedRow.verified_reporters_count);
        }
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [incidentId, onStatusChange, status]);

  const isVerified = status !== "REPORTED" && status !== "FALSE_ALARM";
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <section
      aria-label="Status Konsensus Darurat"
      className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 md:p-6 text-left transition-all duration-300 overflow-hidden"
    >
      {/* Banner Status Konsensus Berwarna Pastel */}
      <div
        className={`p-4 rounded-xl border mb-5 transition-colors ${
          isVerified
            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
            : "bg-amber-50/80 border-amber-200 text-amber-950"
        }`}
      >
        <p
          className={`text-xs font-mono font-bold tracking-widest uppercase mb-1.5 ${
            isVerified ? "text-emerald-800" : "text-amber-800"
          }`}
        >
          {isVerified
            ? "STATUS: TERVERIFIKASI • KONSENSUS TERCAPAI"
            : "STATUS: MENUNGGU VERIFIKASI KONSENSUS SPASIAL"}
        </p>

        <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
          {isVerified
            ? "ARMADA BALAKARCANA & DAMKAR MELUNCUR"
            : "MENUNGGU LAPORAN WARGA TERDEKAT (RADIUS 100M)"}
        </h2>

        {!isVerified && (
          <div className="mt-3 pt-3 border-t border-amber-200/70 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-900 uppercase">
              JENDELA KONSENSUS:
            </span>
            <span className="text-2xl font-mono font-black text-amber-700 tabular-nums tracking-wider">
              {formattedCountdown}
            </span>
          </div>
        )}
      </div>

      {/* Grid Rincian Metrik Taktis (Tabular Nums) */}
      <div className="space-y-2.5 text-xs font-mono border-t border-slate-100 pt-4">
        <div className="flex justify-between items-center py-0.5">
          <span className="text-slate-500 font-medium">ID INSIDEN:</span>
          <span className="text-slate-900 font-bold tracking-wider">
            {incidentId.slice(0, 8)}...
          </span>
        </div>

        <div className="flex justify-between items-center py-0.5">
          <span className="text-slate-500 font-medium">STATUS FSM TAKTIS:</span>
          <span
            className={`font-bold uppercase ${
              isVerified ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex justify-between items-center py-0.5">
          <span className="text-slate-500 font-medium">LAPORAN INDEPENDEN:</span>
          <span className="text-slate-900 font-bold tabular-nums">
            {reportersCount} / 2 PELAPOR (RADIUS {clusterRadiusMeters}M)
          </span>
        </div>
      </div>

      {/* Panduan Operasional Warga */}
      <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 leading-relaxed">
        <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1 font-mono">
          PANDUAN OPERASIONAL WARGA:
        </p>
        <p>
          {isVerified
            ? "Unit pemadam kebakaran dan relawan Balakarcana telah menerima rute navigasi. Harap bersihkan jalan masuk gang dari kendaraan atau barang yang menghalangi selang."
            : "Jika terdapat warga lain di sekitar lokasi yang melihat kebakaran, minta mereka turut menekan tombol darurat di gawainya untuk mempercepat verifikasi otomatis tanpa menunggu posko."}
        </p>
      </div>
    </section>
  );
};
