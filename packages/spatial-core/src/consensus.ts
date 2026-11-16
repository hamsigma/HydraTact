/**
 * Mesin Konsensus Geospasial Anti-Prank
 * 
 * File: packages/spatial-core/src/consensus.ts
 * PIC: @Ilham (TASK-202)
 * Kriteria: Radius <= 100 meter, Selang Waktu <= 3 menit (180 detik), >= 2 pelapor unik.
 */

import { haversineDistanceMeters } from "./haversine.ts";

export interface CitizenReportRecord {
  reporterPhone: string;
  coordinates: [number, number]; // [longitude, latitude]
  timestamp: Date | string | number;
  gpsAccuracyMeters?: number;
  photoHash?: string;
  deviceId?: string;
}

export interface ConsensusOptions {
  clusterRadiusMeters?: number; // default: 100.0m
  timeWindowSeconds?: number;   // default: 180s (3 menit)
  minReportersRequired?: number; // default: 2
  cooldownSeconds?: number;     // default: 60s
}

export interface ConsensusResult {
  isVerified: boolean;
  isHighConfidenceBypass: boolean;
  uniqueReportersCount: number;
  clusterRadiusMeters: number;
  timeWindowSeconds: number;
  allowManualOverride: boolean;
  clusterCenter: [number, number];
  consensusStatus: "VERIFIED" | "PENDING_CONFIRMATION" | "REJECTED_PRANK";
  statusMessage: string;
}

/**
 * Mengevaluasi sekelompok laporan darurat warga terhadap titik target klaster.
 * Mendukung verifikasi konsensus multi-pelapor (>= 2 pelapor unik dalam radius 100m, jeda 180s)
 * atau bypass rule pelapor tunggal berakurasi tinggi (GPS < 15m + foto bukti hash valid).
 */
export function evaluateConsensus(
  reports: CitizenReportRecord[],
  targetCoordinates: [number, number],
  referenceTime: Date | string | number = new Date(),
  options: ConsensusOptions = {}
): ConsensusResult {
  const radius = options.clusterRadiusMeters ?? 100.0;
  const timeWindowSec = options.timeWindowSeconds ?? 180;
  const minRequired = options.minReportersRequired ?? 2;
  const cooldownSec = options.cooldownSeconds ?? 60;

  const refTimeMs = new Date(referenceTime).getTime();
  const maxTimeDiffMs = timeWindowSec * 1000;
  const cooldownMs = cooldownSec * 1000;

  const uniqueValidPhones = new Set<string>();
  const phoneLastReportMs = new Map<string, number>();
  let hasValidBypass = false;

  for (const report of reports) {
    const reportTimeMs = new Date(report.timestamp).getTime();
    const timeDiffMs = Math.abs(refTimeMs - reportTimeMs);

    // Filter jendela waktu <= 3 menit
    if (timeDiffMs <= maxTimeDiffMs) {
      const distance = haversineDistanceMeters(report.coordinates, targetCoordinates);
      // Filter radius <= 100 meter
      if (distance <= radius) {
        const phone = report.reporterPhone.trim();
        const prevTime = phoneLastReportMs.get(phone);

        // Anti-spam cooldown per device/phone
        if (prevTime !== undefined && Math.abs(reportTimeMs - prevTime) < cooldownMs) {
          continue;
        }

        phoneLastReportMs.set(phone, reportTimeMs);
        if (phone) {
          uniqueValidPhones.add(phone);
        }

        // Bypass rule: Akurasi GPS tinggi (< 15 meter) + Foto bukti valid
        if (
          report.gpsAccuracyMeters !== undefined &&
          report.gpsAccuracyMeters <= 15.0 &&
          report.photoHash &&
          report.photoHash.length >= 8
        ) {
          hasValidBypass = true;
        }
      }
    }
  }

  const uniqueCount = uniqueValidPhones.size;
  const isVerified = uniqueCount >= minRequired || hasValidBypass;
  const isHighConfidenceBypass = hasValidBypass;

  let consensusStatus: ConsensusResult["consensusStatus"];
  let statusMessage: string;

  if (isHighConfidenceBypass) {
    consensusStatus = "VERIFIED";
    statusMessage = "Terverifikasi via GPS Presisi Tinggi (< 15m) & Bukti Visual Foto.";
  } else if (uniqueCount >= minRequired) {
    consensusStatus = "VERIFIED";
    statusMessage = `Konsensus tercapai: ${uniqueCount}/${minRequired} laporan warga terverifikasi dalam radius ${radius}m.`;
  } else if (uniqueCount === 1) {
    consensusStatus = "PENDING_CONFIRMATION";
    statusMessage = `1/${minRequired} Laporan terdeteksi di sekitar Anda - Menunggu konfirmasi warga sekitar...`;
  } else {
    consensusStatus = "REJECTED_PRANK";
    statusMessage = "Nihil laporan valid dalam radius dan jendela waktu aktif (dugaan prank/fiktif).";
  }

  return {
    isVerified,
    isHighConfidenceBypass,
    uniqueReportersCount: uniqueCount,
    clusterRadiusMeters: radius,
    timeWindowSeconds: timeWindowSec,
    allowManualOverride: !isVerified,
    clusterCenter: targetCoordinates,
    consensusStatus,
    statusMessage,
  };
}

export const evaluateSpatialConsensus = evaluateConsensus;

