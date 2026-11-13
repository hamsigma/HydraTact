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
}

export interface ConsensusOptions {
  clusterRadiusMeters?: number; // default: 100.0m
  timeWindowSeconds?: number;   // default: 180s (3 menit)
  minReportersRequired?: number; // default: 2
}

export interface ConsensusResult {
  isVerified: boolean;
  uniqueReportersCount: number;
  clusterRadiusMeters: number;
  timeWindowSeconds: number;
  allowManualOverride: boolean;
  clusterCenter: [number, number];
}

/**
 * Mengevaluasi sekelompok laporan darurat warga terhadap titik target klaster.
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

  const refTimeMs = new Date(referenceTime).getTime();
  const maxTimeDiffMs = timeWindowSec * 1000;

  const uniqueValidPhones = new Set<string>();

  for (const report of reports) {
    const reportTimeMs = new Date(report.timestamp).getTime();
    const timeDiffMs = Math.abs(refTimeMs - reportTimeMs);

    // Filter jendela waktu <= 3 menit
    if (timeDiffMs <= maxTimeDiffMs) {
      const distance = haversineDistanceMeters(report.coordinates, targetCoordinates);
      // Filter radius <= 100 meter
      if (distance <= radius) {
        uniqueValidPhones.add(report.reporterPhone.trim());
      }
    }
  }

  const uniqueCount = uniqueValidPhones.size;
  const isVerified = uniqueCount >= minRequired;

  return {
    isVerified,
    uniqueReportersCount: uniqueCount,
    clusterRadiusMeters: radius,
    timeWindowSeconds: timeWindowSec,
    allowManualOverride: !isVerified, // Izinkan komando posko manual override jika malam hari / pelapor tunggal
    clusterCenter: targetCoordinates,
  };
}
