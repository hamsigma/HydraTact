/**
 * Kalkulasi Jarak Terestrial Haversine WGS 84
 * 
 * File: packages/spatial-core/src/haversine.ts
 * PIC: @Ilham (TASK-202)
 */

export const EARTH_RADIUS_METERS = 6371000.0;

/**
 * Menghitung jarak spasial antara dua titik koordinat [longitude, latitude] dalam satuan meter.
 * 
 * @param coord1 Koordinat awal [longitude, latitude]
 * @param coord2 Koordinat tujuan [longitude, latitude]
 * @returns Jarak dalam meter (dibulatkan ke 2 desimal)
 */
export function haversineDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const toRad = (deg: number) => (deg * Math.PI) / 180.0;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2.0) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2.0) ** 2;

  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

export interface WaterSourceRecord {
  id: string;
  name: string;
  type: "HYDRANT" | "WATER_TANK" | "RIVER_DOCK";
  coordinates: [number, number]; // [lat, lng]
  status: "READY" | "LOW_DISCHARGE" | "EMPTY";
  dischargeLitersPerMin?: number;
}

export interface NearestWaterSourceResult extends WaterSourceRecord {
  distanceMeters: number;
  estimatedTravelMinutes: number;
}

/**
 * Menghitung estimasi waktu tempuh armada dalam menit dengan asumsi kecepatan rata-rata perkotaan.
 */
export function calculateEstimatedTravelMinutes(
  distanceMeters: number,
  averageSpeedKmh: number = 30.0
): number {
  const speedMetersPerMinute = (averageSpeedKmh * 1000.0) / 60.0;
  return Math.round((distanceMeters / speedMetersPerMinute) * 10) / 10;
}

/**
 * Menemukan dan mengurutkan N sumber air terdekat menggunakan formula Haversine.
 */
export function findNearestWaterSources(
  currentLat: number,
  currentLng: number,
  sources: WaterSourceRecord[],
  limit: number = 3,
  includeLowDischarge: boolean = true
): NearestWaterSourceResult[] {
  const filtered = sources.filter((s) => {
    if (s.status === "EMPTY") return false;
    if (!includeLowDischarge && s.status === "LOW_DISCHARGE") return false;
    return true;
  });

  const withDistances: NearestWaterSourceResult[] = filtered.map((s) => {
    const dist = haversineDistanceMeters(
      [currentLng, currentLat],
      [s.coordinates[1], s.coordinates[0]]
    );
    return {
      ...s,
      distanceMeters: dist,
      estimatedTravelMinutes: calculateEstimatedTravelMinutes(dist),
    };
  });

  withDistances.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return withDistances.slice(0, limit);
}

export interface TidalSuctionResult {
  waterElevationMeters: number;
  isViable: boolean;
  status: "READY" | "LOW_DISCHARGE" | "SUCTION_UNAVAILABLE_LOW_TIDE";
  effectiveDischargeLpm: number;
  tidalPhase: "HIGH_TIDE" | "EBBING" | "LOW_TIDE" | "FLOODING";
  recommendedAlternativeType: "HYDRANT" | "WATER_TANK";
  notes: string;
}

/**
 * Menghitung elevasi air pasang surut Sungai Karang Mumus / Sungai Mahakam
 * dan menentukan kelayakan hisap pompa apung (Floating Suction Pump).
 */
export function evaluateTidalSuctionViability(
  timestamp: Date | string | number = new Date(),
  nominalDischargeLpm: number = 2800
): TidalSuctionResult {
  const date = new Date(timestamp);
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60.0;
  const period = 12.4;
  const peakHour = 2.0;

  // Model sinusoida semi-diurnal Samarinda
  const meanElevation = 0.8;
  const amplitude = 1.0;
  const phaseAngle = (2 * Math.PI * (hours - peakHour)) / period;
  const elevation = Math.round((meanElevation + amplitude * Math.cos(phaseAngle)) * 100) / 100;

  const minSuctionThresholdMeters = 0.2;
  const isViable = elevation >= minSuctionThresholdMeters;

  let status: TidalSuctionResult["status"];
  let effectiveDischarge: number;
  let tidalPhase: TidalSuctionResult["tidalPhase"];
  let notes: string;

  if (elevation >= 1.2) {
    tidalPhase = "HIGH_TIDE";
    status = "READY";
    effectiveDischarge = nominalDischargeLpm;
    notes = `Pasang optimal (${elevation.toFixed(2)}m). Pompa apung dapat menyedot debit maksimal.`;
  } else if (elevation >= minSuctionThresholdMeters) {
    tidalPhase = Math.sin(phaseAngle) > 0 ? "EBBING" : "FLOODING";
    status = "READY";
    effectiveDischarge = Math.round(nominalDischargeLpm * 0.85);
    notes = `Permukaan air memadai (${elevation.toFixed(2)}m). Hisap apung beroperasi normal.`;
  } else {
    tidalPhase = "LOW_TIDE";
    status = "SUCTION_UNAVAILABLE_LOW_TIDE";
    effectiveDischarge = 0;
    notes = `Surut kritis (${elevation.toFixed(2)}m < ambang ${minSuctionThresholdMeters}m). Pompa apung berisiko menyedot lumpur dasar SKM. Alihkan ke hidran PDAM.`;
  }

  return {
    waterElevationMeters: elevation,
    isViable,
    status,
    effectiveDischargeLpm: effectiveDischarge,
    tidalPhase,
    recommendedAlternativeType: "HYDRANT",
    notes,
  };
}



