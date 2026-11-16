/**
 * Data Sumber Air Samarinda (Water Sources Repository).
 *
 * Sebaran 30 titik hidran PDAM, tandon komunal warga, dan dermaga sedot
 * Sungai Karang Mumus (SKM) / Sungai Mahakam yang telah dikalibrasi presisi
 * dengan geometri jalan & toponimi resmi OpenStreetMap (OSM) Kota Samarinda.
 *
 * File: apps/web-command/src/lib/water-sources.ts
 * PIC: @Hervino (TASK-305)
 */

export interface WaterSourcePoint {
  id: string;
  name: string;
  type: "HYDRANT" | "WATER_TANK" | "RIVER_DOCK";
  coordinates: [number, number]; // [lat, lng] terkalibrasi ke jalan OSM
  status: "READY" | "LOW_DISCHARGE" | "EMPTY";
  dischargeLitersPerMin?: number;
}

export interface ActiveIncidentMarker {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng] terkalibrasi ke gang OSM
  status: "REPORTED" | "VERIFIED" | "DISPATCHED" | "WATER_ON_FIRE" | "CONTROLLED" | "RESOLVED" | "FALSE_ALARM";
  reportersCount: number;
}

export const DEFAULT_SAMARINDA_WATER_SOURCES: WaterSourcePoint[] = [
  // 1. Sektor Komersial Citra Niaga & Pasar Pagi (Samarinda Kota)
  { id: "ws-01", name: "Hidran PDAM Jl. Niaga Utara (Citra Niaga)", type: "HYDRANT", coordinates: [-0.5031, 117.1508], status: "READY", dischargeLitersPerMin: 1200 },
  { id: "ws-02", name: "Hidran PDAM Jl. Niaga Timur No. 2", type: "HYDRANT", coordinates: [-0.5037, 117.1513], status: "READY", dischargeLitersPerMin: 1100 },
  { id: "ws-03", name: "Tandon Warga Jl. Niaga Selatan", type: "WATER_TANK", coordinates: [-0.5035, 117.1495], status: "READY", dischargeLitersPerMin: 800 },
  { id: "ws-04", name: "Hidran PDAM Jl. Panglima Batur", type: "HYDRANT", coordinates: [-0.5021, 117.1498], status: "READY", dischargeLitersPerMin: 1400 },
  { id: "ws-05", name: "Hidran PDAM Pasar Pagi (Jl. Jend. Sudirman)", type: "HYDRANT", coordinates: [-0.5023, 117.1465], status: "LOW_DISCHARGE", dischargeLitersPerMin: 400 },
  { id: "ws-06", name: "Dermaga Sedot Tepian Mahakam (Jl. Gajah Mada)", type: "RIVER_DOCK", coordinates: [-0.5035, 117.1445], status: "READY", dischargeLitersPerMin: 3200 },
  { id: "ws-07", name: "Hidran PDAM Jl. KH. Khalid", type: "HYDRANT", coordinates: [-0.5011, 117.1472], status: "EMPTY", dischargeLitersPerMin: 0 },
  { id: "ws-08", name: "Hidran PDAM Jl. Pangeran Diponegoro", type: "HYDRANT", coordinates: [-0.5004, 117.1500], status: "READY", dischargeLitersPerMin: 1350 },
  { id: "ws-09", name: "Hidran PDAM Jl. Abul Hasan", type: "HYDRANT", coordinates: [-0.4979, 117.1487], status: "READY", dischargeLitersPerMin: 1250 },
  { id: "ws-10", name: "Dermaga Sedot SKM Jl. Perniagaan", type: "RIVER_DOCK", coordinates: [-0.4925, 117.1530], status: "READY", dischargeLitersPerMin: 2400 },

  // 2. Sektor Koridor Sungai Karang Mumus & Karang Mumus Ilir
  { id: "ws-11", name: "Dermaga Sedot SKM Jembatan Kehewanan (Jembatan 1)", type: "RIVER_DOCK", coordinates: [-0.4942, 117.1588], status: "READY", dischargeLitersPerMin: 2800 },
  { id: "ws-12", name: "Hidran PDAM Jl. Pangeran Hidayatullah", type: "HYDRANT", coordinates: [-0.5021, 117.1553], status: "READY", dischargeLitersPerMin: 1300 },
  { id: "ws-13", name: "Tandon Warga Jl. Muso Salim Gg. 11", type: "WATER_TANK", coordinates: [-0.5016, 117.1583], status: "READY", dischargeLitersPerMin: 850 },
  { id: "ws-14", name: "Dermaga SKM Muara Sungai Dama (Selili)", type: "RIVER_DOCK", coordinates: [-0.5085, 117.1558], status: "READY", dischargeLitersPerMin: 3400 },
  { id: "ws-15", name: "Hidran PDAM Jl. KH. Agus Salim", type: "HYDRANT", coordinates: [-0.4912, 117.1527], status: "LOW_DISCHARGE", dischargeLitersPerMin: 450 },
  { id: "ws-16", name: "Hidran PDAM Simpang Basuki Rahmat", type: "HYDRANT", coordinates: [-0.4930, 117.1480], status: "READY", dischargeLitersPerMin: 1450 },
  { id: "ws-17", name: "Hidran PDAM Jl. Awang Long", type: "HYDRANT", coordinates: [-0.4980, 117.1445], status: "READY", dischargeLitersPerMin: 1200 },
  { id: "ws-18", name: "Tandon Warga Karang Mumus (Jl. Jelawat)", type: "WATER_TANK", coordinates: [-0.5005, 117.1610], status: "LOW_DISCHARGE", dischargeLitersPerMin: 350 },
  { id: "ws-19", name: "Dermaga Sedot SKM Agus Salim", type: "RIVER_DOCK", coordinates: [-0.4918, 117.1532], status: "READY", dischargeLitersPerMin: 2600 },

  // 3. Sektor Pasar Segiri, Jl. Pahlawan, Dr. Soetomo & Permukiman Padat Pelita
  { id: "ws-20", name: "Hidran PDAM Pasar Segiri No. 1 (Jl. Pahlawan)", type: "HYDRANT", coordinates: [-0.4824, 117.1492], status: "READY", dischargeLitersPerMin: 1600 },
  { id: "ws-21", name: "Hidran PDAM Sisi Timur Pasar Segiri", type: "HYDRANT", coordinates: [-0.4830, 117.1505], status: "READY", dischargeLitersPerMin: 1550 },
  { id: "ws-22", name: "Dermaga Sedot SKM Pasar Segiri", type: "RIVER_DOCK", coordinates: [-0.4818, 117.1495], status: "READY", dischargeLitersPerMin: 3000 },
  { id: "ws-23", name: "Hidran PDAM Jl. Dr. Soetomo", type: "HYDRANT", coordinates: [-0.4835, 117.1445], status: "READY", dischargeLitersPerMin: 1300 },
  { id: "ws-24", name: "Hidran PDAM Jl. Lambung Mangkurat", type: "HYDRANT", coordinates: [-0.4901, 117.1587], status: "READY", dischargeLitersPerMin: 1500 },
  { id: "ws-25", name: "Tandon Komunal Warga Gg. 4 Jl. Pelita", type: "WATER_TANK", coordinates: [-0.4845, 117.1633], status: "READY", dischargeLitersPerMin: 900 },
  { id: "ws-26", name: "Hidran PDAM Mulut Jl. Pelita (Arteri)", type: "HYDRANT", coordinates: [-0.4839, 117.1639], status: "READY", dischargeLitersPerMin: 1350 },
  { id: "ws-27", name: "Tandon Warga Simpang Jl. Sentosa", type: "WATER_TANK", coordinates: [-0.4815, 117.1610], status: "READY", dischargeLitersPerMin: 850 },
  { id: "ws-28", name: "Hidran PDAM Posko Citra Niaga / Pelabuhan", type: "HYDRANT", coordinates: [-0.5042, 117.1508], status: "READY", dischargeLitersPerMin: 1800 },
  { id: "ws-29", name: "Dermaga Sedot SKM Jembatan Baru Segiri", type: "RIVER_DOCK", coordinates: [-0.4870, 117.1520], status: "READY", dischargeLitersPerMin: 3100 },
  { id: "ws-30", name: "Tandon Cadangan Sungai Dama (Jl. Otista)", type: "WATER_TANK", coordinates: [-0.5095, 117.1590], status: "READY", dischargeLitersPerMin: 950 },
];

export interface NearestWaterSourceResult extends WaterSourcePoint {
  distanceMeters: number;
  estimatedTravelMinutes: number;
}

export function haversineDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const toRad = (deg: number) => (deg * Math.PI) / 180.0;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);
  const a =
    Math.sin(deltaPhi / 2.0) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return Math.round(6371000.0 * c * 10) / 10;
}

export function calculateEstimatedTravelMinutes(
  distanceMeters: number,
  averageSpeedKmh: number = 30.0
): number {
  const speedMetersPerMinute = (averageSpeedKmh * 1000.0) / 60.0;
  return Math.round((distanceMeters / speedMetersPerMinute) * 10) / 10;
}

export function findNearestWaterSources(
  currentLat: number,
  currentLng: number,
  sources: WaterSourcePoint[] = DEFAULT_SAMARINDA_WATER_SOURCES,
  limit: number = 3,
  includeLowDischarge: boolean = true
): NearestWaterSourceResult[] {
  const filtered = sources.filter((s) => {
    if (s.status === "EMPTY") return false;
    if (!includeLowDischarge && s.status === "LOW_DISCHARGE") return false;
    return true;
  });

  const withDistances = filtered.map((s) => {
    const dist = haversineDistanceMeters([currentLat, currentLng], s.coordinates);
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

export function evaluateTidalSuctionViability(
  timestamp: Date | string | number = new Date(),
  nominalDischargeLpm: number = 2800
): TidalSuctionResult {
  const date = new Date(timestamp);
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60.0;
  const period = 12.4;
  const peakHour = 2.0;

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


