"use client";

import React, { useState, useEffect, useRef } from "react";
import { subscribeToIncidentRealtime, type IncidentRealtimeRow } from "../lib/supabase-realtime";
import { triggerHaptic } from "../utils/haptic";

export interface CitizenConsensusCardProps {
  incidentId: string;
  reporterPhone?: string;
  initialStatus: string;
  initialReportersCount: number;
  clusterRadiusMeters?: number;
  createdAt: string;
  onStatusChange?: (newStatus: string) => void;
}

function formatPhoneIndonesian(phone?: string): string {
  if (!phone) return "+62 812-3456-7890 (Tersimpan)";
  const clean = phone.trim().replace(/[-\s]/g, "");
  if (clean.startsWith("08")) {
    const rest = clean.slice(2);
    return `+62 8${rest.slice(0, 2)}-${rest.slice(2, 6)}-${rest.slice(6)}`;
  }
  if (clean.startsWith("+62")) {
    const rest = clean.slice(3);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  if (clean.startsWith("62")) {
    const rest = clean.slice(2);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return clean;
}

export const CitizenConsensusCard: React.FC<CitizenConsensusCardProps> = ({
  incidentId,
  reporterPhone,
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

      {/* Kartu Kontak WhatsApp Pelapor Terdata */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-xl mb-5 text-xs font-mono">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.419-.101.824z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              NOMOR WHATSAPP PELAPOR TERDATA:
            </span>
            <p className="text-base font-bold text-slate-900 tracking-wider tabular-nums mt-0.5">
              {formatPhoneIndonesian(reporterPhone)}
            </p>
            <p className="text-[11px] text-emerald-900/80 mt-1 leading-relaxed">
              Nomor kontak Anda telah tersimpan di posko komando. Petugas atau relawan Balakarcana dapat menghubungi nomor ini untuk konfirmasi rute gang dan kondisi titik api.
            </p>
          </div>
        </div>

        {/* Baris Aksi Dua Arah */}
        <div className="mt-3.5 pt-3 border-t border-emerald-200/70 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            SIAP DIHUBUNGI PETUGAS
          </span>

          <a
            href={`https://wa.me/62811558113?text=${encodeURIComponent(
              `Halo Posko Damkar Samarinda, saya pelapor insiden kebakaran #${incidentId.slice(0, 8)} (${formatPhoneIndonesian(
                reporterPhone
              )}). Saya siap memberikan informasi tambahan mengenai titik api.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.419-.101.824z" />
            </svg>
            CHAT POSKO DAMKAR
          </a>
        </div>
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
          <span className="text-slate-500 font-medium">KONTAK WHATSAPP:</span>
          <span className="text-slate-900 font-bold tabular-nums">
            {formatPhoneIndonesian(reporterPhone)}
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

        {/* Daftar Verifikasi Pelapor di Radius Geofencing */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-slate-500 font-medium block mb-1 text-[11px]">
            PELAPOR TERDATA DI SEKTOR:
          </span>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="font-bold text-slate-800">{formatPhoneIndonesian(reporterPhone)} (Gawai Anda)</span>
              <span className="text-emerald-700 font-bold">TERDATA</span>
            </div>
            {reportersCount >= 2 && (
              <div className="flex items-center justify-between p-2 bg-emerald-50/60 border border-emerald-200/80 rounded-lg">
                <span className="font-bold text-slate-800">+62 852-••••-7890 (Warga Sekitar)</span>
                <span className="text-emerald-700 font-bold">KONSENSUS VALID</span>
              </div>
            )}
          </div>
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
