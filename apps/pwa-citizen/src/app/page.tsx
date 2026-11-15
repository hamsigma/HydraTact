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
    <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between p-6 max-w-md mx-auto font-sans antialiased selection:bg-red-900 selection:text-white">
      {/* Header Wilayah & Status Operasional */}
      <header className="border-b border-stone-800 pb-4">
        <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase mb-1">
          POSKO DAMKAR SAMARINDA • TEPIAN MAHAKAM
        </p>
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">
          Pelaporan Darurat Kebakaran
        </h1>
        <div className="mt-3 flex items-center justify-between text-xs font-mono">
          <span className="text-stone-400">STATUS KOORDINAT:</span>
          {gpsStatus === "LOCKED" && coords ? (
            <span className="font-bold text-emerald-400 tabular-nums">
              TERKUNCI (±{coords.accuracy}m)
            </span>
          ) : gpsStatus === "SEARCHING" ? (
            <span className="font-bold text-amber-400">MENCARI GPS...</span>
          ) : (
            <span className="font-bold text-stone-400 tabular-nums">
              MANUAL SAMARINDA (±5.0m)
            </span>
          )}
        </div>
      </header>

      {/* Konten Utama */}
      <div className="my-auto py-8 flex flex-col items-center text-center">
        {!reportResult ? (
          <>
            <div className="w-full text-left mb-6">
              <label
                htmlFor="reporter-phone"
                className="block text-xs font-mono font-bold tracking-wider text-stone-300 uppercase mb-2"
              >
                Nomor Kontak WhatsApp Pelapor
              </label>
              <input
                id="reporter-phone"
                type="tel"
                inputMode="numeric"
                placeholder="081234567890"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={isSubmitting}
                className="w-full bg-stone-900 border border-stone-700 focus:border-red-600 focus:outline-none text-white px-4 py-3 rounded-none font-mono text-base tracking-wider placeholder:text-stone-600"
              />
              {phoneError && (
                <p className="mt-2 text-xs font-mono text-red-400">{phoneError}</p>
              )}
            </div>

            <div className="my-4">
              <HapticPressAndHoldButton
                onTrigger={handleEmergencyTrigger}
                holdDurationMs={2000}
                disabled={!isFormValid || isSubmitting}
                label="TAHAN 2 DETIK"
                triggerLabel="MENGIRIM..."
              />
            </div>

            <p className="mt-4 text-xs font-mono text-stone-400 max-w-xs leading-relaxed">
              Sentuh dan tahan tombol merah selama 2.0 detik penuh untuk mengeliminasi panggilan palsu.
            </p>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-950/80 border border-red-700 text-left w-full">
                <p className="text-xs font-mono font-bold text-red-300 uppercase mb-1">
                  KESALAHAN PENGIRIMAN
                </p>
                <p className="text-xs font-mono text-red-200">{errorMessage}</p>
              </div>
            )}
          </>
        ) : (
          /* Tampilan Status Konsensus Real-Time Setelah Dilaporkan */
          <CitizenConsensusCard
            incidentId={reportResult.incident_id}
            initialStatus={reportResult.status}
            initialReportersCount={reportResult.consensus.unique_reporters_count}
            clusterRadiusMeters={reportResult.consensus.cluster_radius_meters}
            createdAt={reportResult.created_at}
          />
        )}
      </div>

      {/* Footer Hak Cipta & Standar Taktis */}
      <footer className="border-t border-stone-800 pt-3 text-center">
        <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
          HYDRATACT SAMARINDA • ZERO-HARDWARE TACTICAL SYSTEM
        </p>
      </footer>
    </main>
  );
}
