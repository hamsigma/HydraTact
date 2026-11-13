/**
 * Client-Side Map-Matching Snapping Algorithm (Mitigasi GPS Multipath Drift)
 * 
 * File: packages/spatial-core/src/snapping.ts
 * PIC: @Ilham (TASK-402)
 * Kriteria Desain (docs/Architecture.md §5.4):
 * - Menghitung jarak tegak lurus terdekat (d_perp) dari koordinat GPS mentah ke segmen jalan.
 * - Jika d_perp <= 25.0 meter, kunci (snap) koordinat ke garis jalan terdekat.
 * - Jika d_perp > 25.0 meter, pertahankan koordinat mentah asli (isSnapped = false).
 */

import { haversineDistanceMeters } from "./haversine.ts";

export interface RoadSegment {
  roadName: string;
  roadWidthMeters: number;
  startPoint: [number, number]; // [longitude, latitude]
  endPoint: [number, number];   // [longitude, latitude]
}

export interface SnappingResult {
  originalCoordinates: [number, number]; // [longitude, latitude]
  snappedCoordinates: [number, number];  // [longitude, latitude]
  deviationMeters: number;
  isSnapped: boolean;
  snappedRoadName: string | null;
  detectedRoadWidthMeters: number | null;
}

/**
 * Memproyeksikan titik koordinat P ke segmen garis AB.
 * Mengembalikan titik terdekat pada segmen garis serta jaraknya dalam meter.
 */
export function projectPointToSegment(
  point: [number, number],
  segA: [number, number],
  segB: [number, number]
): { projectedPoint: [number, number]; distanceMeters: number } {
  const [px, py] = point;
  const [ax, ay] = segA;
  const [bx, by] = segB;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  // Jika segmen adalah titik tunggal
  if (lenSq === 0) {
    const dist = haversineDistanceMeters(point, segA);
    return { projectedPoint: segA, distanceMeters: dist };
  }

  // Faktor proyeksi skalar t = ((P - A) . (B - A)) / |B - A|^2
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;

  // Batasi t pada rentang segmen [0, 1]
  t = Math.max(0.0, Math.min(1.0, t));

  const projX = ax + t * dx;
  const projY = ay + t * dy;
  const projectedPoint: [number, number] = [
    Math.round(projX * 1000000) / 1000000,
    Math.round(projY * 1000000) / 1000000,
  ];

  const distanceMeters = haversineDistanceMeters(point, projectedPoint);
  return { projectedPoint, distanceMeters };
}

/**
 * Mengunci (snap) koordinat mentah GPS ke jaringan segmen jalan terdekat jika deviasi <= maxDeviationMeters (25m).
 */
export function snapCoordinatesToRoadNetwork(
  rawCoordinates: [number, number],
  roadNetwork: RoadSegment[],
  maxDeviationMeters: number = 25.0
): SnappingResult {
  if (!roadNetwork || roadNetwork.length === 0) {
    return {
      originalCoordinates: rawCoordinates,
      snappedCoordinates: rawCoordinates,
      deviationMeters: 0.0,
      isSnapped: false,
      snappedRoadName: null,
      detectedRoadWidthMeters: null,
    };
  }

  let minDistance = Number.POSITIVE_INFINITY;
  let bestProjectedPoint: [number, number] = rawCoordinates;
  let bestRoadSegment: RoadSegment | null = null;

  for (const segment of roadNetwork) {
    const { projectedPoint, distanceMeters } = projectPointToSegment(
      rawCoordinates,
      segment.startPoint,
      segment.endPoint
    );

    if (distanceMeters < minDistance) {
      minDistance = distanceMeters;
      bestProjectedPoint = projectedPoint;
      bestRoadSegment = segment;
    }
  }

  const isSnapped = minDistance <= maxDeviationMeters && bestRoadSegment !== null;

  return {
    originalCoordinates: rawCoordinates,
    snappedCoordinates: isSnapped ? bestProjectedPoint : rawCoordinates,
    deviationMeters: Math.round(minDistance * 100) / 100,
    isSnapped,
    snappedRoadName: isSnapped && bestRoadSegment ? bestRoadSegment.roadName : null,
    detectedRoadWidthMeters: isSnapped && bestRoadSegment ? bestRoadSegment.roadWidthMeters : null,
  };
}
