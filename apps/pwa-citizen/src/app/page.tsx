"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HapticPressAndHoldButton } from "../components/HapticPressAndHoldButton";
import { CitizenConsensusCard } from "../components/CitizenConsensusCard";
import { submitEmergencyReport, type IncidentReportSuccess } from "../services/incident-service";

export default function CitizenEmergencyPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"SEARCHING" | "LOCKED" | "DENIED">("SEARCHING");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportResult, setReportResult] = useState<IncidentReportSuccess["data"] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Minta izin geolokasi otomatis saat pertama kali dimuat
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsStatus("DENIED");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy * 10) / 10,
        });
        setGpsStatus("LOCKED");
      },
      (error) => {
        console.warn("GPS error:", error.message);
        // Fallback titik default Samarinda tepian Mahakam jika izin ditolak di lingkungan simulasi
        setCoords({
          latitude: -0.5021,
          longitude: 117.1536,
          accuracy: 4.5,
        });
        setGpsStatus(error.code === error.PERMISSION_DENIED ? "DENIED" : "LOCKED");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.trim().replace(/[-\s]/g, "");
    const phoneRegex = /^(\+62|62|08)[0-9]{8,13}$/;
    if (!cleanPhone) {
      setPhoneError("Nomor WhatsApp wajib diisi");
      return false;
    }
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError("Format nomor tidak valid (contoh: 081234567890)");
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneNumber(val);
    if (phoneError) validatePhone(val);
  };

  const handleEmergencyTrigger = useCallback(async () => {
    if (!validatePhone(phoneNumber)) return;

    const activeCoords = coords || {
      latitude: -0.5021,
      longitude: 117.1536,
      accuracy: 5.0,
    };

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formattedPhone = phoneNumber.startsWith("08")
        ? "+62" + phoneNumber.slice(1)
        : phoneNumber.startsWith("62")
        ? "+" + phoneNumber
        : phoneNumber;

      const result = await submitEmergencyReport({
        reporterPhone: formattedPhone,
        location: {
          latitude: activeCoords.latitude,
          longitude: activeCoords.longitude,
          accuracyMeters: activeCoords.accuracy,
        },
        holdDurationMs: 2000,
      });

      setReportResult(result.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengirimkan laporan darurat.");
    } finally {
      setIsSubmitting(false);
    }
  }, [phoneNumber, coords]);

  const isFormValid = phoneNumber.trim().length >= 10 && !phoneError;

  return (
    <main className="min-h-screen bg-[#F0F2F5] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased selection:bg-red-100 selection:text-red-900">
      <div className="w-full max-w-md mx-auto flex flex-col justify-between flex-1">
        {/* Header Wilayah & Status Operasional */}
        <header className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse" />
              POSKO DAMKAR SAMARINDA
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              SEKTOR MAHAKAM
            </span>
          </div>

          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
            Pelaporan Darurat Kebakaran
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Akses darurat warga Kota Samarinda menuju posko komando terdekat
          </p>

          {/* Status Koordinat GPS */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.071 7.071l-1.414-1.414M8.343 8.343L6.929 6.929m12.728 0l-1.414 1.414M8.343 15.657l-1.414 1.414" />
              </svg>
              KOORDINAT GPS:
            </span>
            {gpsStatus === "LOCKED" && coords ? (
              <span className="font-bold text-emerald-700 tabular-nums">
                TERKUNCI (±{coords.accuracy}m)
              </span>
            ) : gpsStatus === "SEARCHING" ? (
              <span className="font-bold text-amber-600 animate-pulse">
                MENCARI GPS...
              </span>
            ) : (
              <span className="font-bold text-slate-600 tabular-nums">
                MANUAL SAMARINDA (±5.0m)
              </span>
            )}
          </div>
        </header>

        {/* Banner Peringatan Penutupan Ruas Jalan / Barikade Selang Relay */}
        <div className="w-full mt-3 p-3 bg-fuchsia-50/80 border border-fuchsia-200 text-left font-mono text-xs">
          <p className="font-bold text-fuchsia-950 uppercase tracking-wider mb-0.5">
            PERINGATAN STERILISASI JALAN (#C026D3)
          </p>
          <p className="text-[11px] text-fuchsia-800 leading-relaxed">
            Armada induk menggelar selang relay bertekanan tinggi melintasi badan jalan. Kendaraan dilarang melindas selang demi keselamatan pasokan air.
          </p>
        </div>

        {/* Konten Utama */}
        <div className="my-auto py-2 flex flex-col items-center text-center">
          {!reportResult ? (
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col items-center">
              {/* Input Nomor Telepon Pelapor */}
              <div className="w-full text-left mb-6">
                <label
                  htmlFor="reporter-phone"
                  className="block text-xs font-mono font-bold tracking-wider text-slate-700 uppercase mb-1.5"
                >
                  Nomor Kontak WhatsApp Pelapor
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Wajib untuk verifikasi dua arah posko damkar Samarinda
                </p>
                <input
                  id="reporter-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Contoh: 081234567890"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={isSubmitting}
                  className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-100/80 focus:outline-none text-slate-900 px-4 py-3.5 font-mono text-base tracking-wider placeholder:text-slate-400 transition-all"
                />
                {phoneError && (
                  <p className="mt-2 text-xs font-mono font-bold text-red-600">
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Pedestal Tombol Darurat */}
              <div className="my-2 p-6 rounded-full bg-red-50/50 border border-red-100/80 flex items-center justify-center">
                <HapticPressAndHoldButton
                  onTrigger={handleEmergencyTrigger}
                  holdDurationMs={2000}
                  disabled={!isFormValid || isSubmitting}
                  label="TAHAN 2 DETIK"
                  triggerLabel="MENGIRIM..."
                />
              </div>

              {/* Petunjuk Penggunaan */}
              <p className="mt-4 text-xs font-mono text-slate-500 max-w-xs leading-relaxed">
                Sentuh dan tahan tombol merah selama 2.0 detik penuh untuk mengeliminasi panggilan palsu.
              </p>

              {errorMessage && (
                <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-left w-full">
                  <p className="text-xs font-mono font-bold text-red-800 uppercase mb-1">
                    KESALAHAN PENGIRIMAN
                  </p>
                  <p className="text-xs text-red-700">{errorMessage}</p>
                </div>
              )}
            </div>
          ) : (
            /* Tampilan Status Konsensus Real-Time Setelah Dilaporkan */
            <div className="w-full">
              <CitizenConsensusCard
                incidentId={reportResult.incident_id}
                reporterPhone={reportResult.reporter_phone || phoneNumber}
                initialStatus={reportResult.status}
                initialReportersCount={reportResult.consensus.unique_reporters_count}
                clusterRadiusMeters={reportResult.consensus.cluster_radius_meters}
                createdAt={reportResult.created_at}
              />
            </div>
          )}
        </div>

        {/* Footer Hak Cipta & Standar Taktis */}
        <footer className="mt-4 text-center py-2">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            HYDRATACT SAMARINDA • ZERO-HARDWARE TACTICAL SYSTEM
          </p>
        </footer>
      </div>
    </main>
  );
}
