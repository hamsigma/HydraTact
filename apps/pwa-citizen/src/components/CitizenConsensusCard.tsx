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
      className={`w-full p-6 text-left border transition-all duration-300 ${
        isVerified
          ? "bg-red-950/40 border-red-700"
          : "bg-stone-900 border-stone-800"
      }`}
    >
      {/* Eyebrow Label (Plain Text Monospace - No Pill Chip) */}
      <p
        className={`text-xs font-mono font-bold tracking-widest uppercase mb-2 ${
          isVerified ? "text-red-400" : "text-amber-400"
        }`}
      >
        {isVerified
          ? "TERVERIFIKASI OTOMATIS • KONSENSUS TERCAPAI"
          : "MENUNGGU VERIFIKASI KONSENSUS SPASIAL"}
      </p>

      {/* Judul Status Utama */}
      <h2 className="text-lg font-bold text-white mb-4 tracking-tight">
        {isVerified
          ? "ARMADA BALAKARCANA DIKERAHKAN MENUJU LOKASI"
          : "MENUNGGU LAPORAN WARGA TERDEKAT (RADIUS 100M)"}
      </h2>

      {/* Grid Rincian Metrik (Tabular Nums) */}
      <div className="space-y-3 text-xs font-mono border-t border-stone-800/80 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-stone-400">ID INSIDEN:</span>
          <span className="text-white font-bold tracking-wider">
            {incidentId.slice(0, 8)}...
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-stone-400">STATUS FSM TAKTIS:</span>
          <span
            className={`font-bold uppercase ${
              isVerified ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-stone-400">LAPORAN INDEPENDEN:</span>
          <span className="text-white font-bold tabular-nums">
            {reportersCount} / 2 PELAPOR (RADIUS {clusterRadiusMeters}M)
          </span>
        </div>

        {!isVerified && (
          <div className="flex justify-between items-center">
            <span className="text-stone-400">JENDELA KONSENSUS:</span>
            <span className="text-amber-400 font-bold tabular-nums tracking-wider">
              {formattedCountdown}
            </span>
          </div>
        )}
      </div>

      {/* Panduan Instruksi Warga */}
      <p className="mt-5 text-xs text-stone-300 leading-relaxed">
        {isVerified
          ? "Unit pemadam kebakaran dan relawan Balakarcana telah menerima rute navigasi. Harap bersihkan jalan masuk gang dari kendaraan atau barang yang menghalangi selang."
          : "Jika terdapat warga lain di sekitar lokasi yang melihat kebakaran, minta mereka turut menekan tombol darurat di gawainya untuk mempercepat verifikasi otomatis tanpa menunggu posko."}
      </p>
    </section>
  );
};
