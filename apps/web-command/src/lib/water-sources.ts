/**
 * Data Sumber Air Samarinda (Water Sources Repository).
 *
 * Sebaran 30 titik hidran PDAM, tandon komunal warga, dan dermaga sedot
 * Sungai Karang Mumus (SKM) / Sungai Mahakam untuk pemadaman api.
 *
 * File: apps/web-command/src/lib/water-sources.ts
 * PIC: @Hervino (TASK-305)
 */

export interface WaterSourcePoint {
  id: string;
  name: string;
  type: "HYDRANT" | "WATER_TANK" | "RIVER_DOCK";
  coordinates: [number, number]; // [lat, lng]
  status: "READY" | "LOW_DISCHARGE" | "EMPTY";
  dischargeLitersPerMin?: number;
}

export interface ActiveIncidentMarker {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  status: "REPORTED" | "VERIFIED" | "WATER_ON_FIRE" | "CONTROLLED" | "RESOLVED";
  reportersCount: number;
}

export const DEFAULT_SAMARINDA_WATER_SOURCES: WaterSourcePoint[] = [
  { id: "ws-01", name: "Hidran PDAM Citra Niaga No. 1", type: "HYDRANT", coordinates: [-0.5028, 117.1539], status: "READY", dischargeLitersPerMin: 1200 },
  { id: "ws-02", name: "Hidran PDAM Citra Niaga No. 2", type: "HYDRANT", coordinates: [-0.5035, 117.1545], status: "READY", dischargeLitersPerMin: 1100 },
  { id: "ws-03", name: "Tandon Komunal RT 14 Pelita", type: "WATER_TANK", coordinates: [-0.5015, 117.1528], status: "READY", dischargeLitersPerMin: 800 },
  { id: "ws-04", name: "Dermaga Sedot SKM Jembatan 1", type: "RIVER_DOCK", coordinates: [-0.5002, 117.1512], status: "READY", dischargeLitersPerMin: 2500 },
  { id: "ws-05", name: "Hidran Pasar Pagi Posko 1", type: "HYDRANT", coordinates: [-0.5042, 117.1519], status: "LOW_DISCHARGE", dischargeLitersPerMin: 400 },
  { id: "ws-06", name: "Dermaga Tepian Mahakam Jl. Gajah Mada", type: "RIVER_DOCK", coordinates: [-0.5065, 117.1495], status: "READY", dischargeLitersPerMin: 3200 },
  { id: "ws-07", name: "Tandon Warga Gg. 3 Pelita", type: "WATER_TANK", coordinates: [-0.5019, 117.1531], status: "READY", dischargeLitersPerMin: 900 },
  { id: "ws-08", name: "Hidran PDAM Simpang Pelita", type: "HYDRANT", coordinates: [-0.5011, 117.1542], status: "READY", dischargeLitersPerMin: 1350 },
  { id: "ws-09", name: "Tandon Pemadam Relawan 01", type: "WATER_TANK", coordinates: [-0.5039, 117.1558], status: "LOW_DISCHARGE", dischargeLitersPerMin: 350 },
  { id: "ws-10", name: "Dermaga Sedot SKM Perniagaan", type: "RIVER_DOCK", coordinates: [-0.4995, 117.1525], status: "READY", dischargeLitersPerMin: 2400 },
  { id: "ws-11", name: "Hidran PDAM Jl. KH Khalid", type: "HYDRANT", coordinates: [-0.5048, 117.1532], status: "EMPTY", dischargeLitersPerMin: 0 },
  { id: "ws-12", name: "Hidran Jl. Panglima Batur", type: "HYDRANT", coordinates: [-0.5055, 117.1515], status: "READY", dischargeLitersPerMin: 1400 },
  { id: "ws-13", name: "Tandon Warga Karang Asam", type: "WATER_TANK", coordinates: [-0.5072, 117.1478], status: "READY", dischargeLitersPerMin: 750 },
  { id: "ws-14", name: "Dermaga SKM Jembatan 2", type: "RIVER_DOCK", coordinates: [-0.4982, 117.1538], status: "READY", dischargeLitersPerMin: 2800 },
  { id: "ws-15", name: "Hidran Jl. Abul Hasan", type: "HYDRANT", coordinates: [-0.5022, 117.1555], status: "READY", dischargeLitersPerMin: 1250 },
  { id: "ws-16", name: "Hidran Jl. Diponegoro", type: "HYDRANT", coordinates: [-0.4998, 117.1562], status: "LOW_DISCHARGE", dischargeLitersPerMin: 450 },
  { id: "ws-17", name: "Tandon Komunal Bandara Lama", type: "WATER_TANK", coordinates: [-0.4975, 117.1582], status: "READY", dischargeLitersPerMin: 1000 },
  { id: "ws-18", name: "Dermaga Sedot SKM Agus Salim", type: "RIVER_DOCK", coordinates: [-0.4965, 117.1548], status: "READY", dischargeLitersPerMin: 2600 },
  { id: "ws-19", name: "Hidran PDAM Jl. Kesuma Bangsa", type: "HYDRANT", coordinates: [-0.4952, 117.1565], status: "READY", dischargeLitersPerMin: 1500 },
  { id: "ws-20", name: "Tandon Warga Simpang Sentosa", type: "WATER_TANK", coordinates: [-0.4938, 117.1591], status: "READY", dischargeLitersPerMin: 850 },
  { id: "ws-21", name: "Dermaga SKM Gang Damai", type: "RIVER_DOCK", coordinates: [-0.4948, 117.1532], status: "LOW_DISCHARGE", dischargeLitersPerMin: 600 },
  { id: "ws-22", name: "Hidran PDAM Pasar Segiri No. 1", type: "HYDRANT", coordinates: [-0.4925, 117.1545], status: "READY", dischargeLitersPerMin: 1600 },
  { id: "ws-23", name: "Hidran PDAM Pasar Segiri No. 2", type: "HYDRANT", coordinates: [-0.4918, 117.1552], status: "READY", dischargeLitersPerMin: 1550 },
  { id: "ws-24", name: "Tandon Komunal Pahlawan", type: "WATER_TANK", coordinates: [-0.4905, 117.1578], status: "EMPTY", dischargeLitersPerMin: 0 },
  { id: "ws-25", name: "Dermaga SKM Jembatan Baru Segiri", type: "RIVER_DOCK", coordinates: [-0.4912, 117.1539], status: "READY", dischargeLitersPerMin: 3000 },
  { id: "ws-26", name: "Hidran Jl. Dr. Soetomo", type: "HYDRANT", coordinates: [-0.4895, 117.1561], status: "READY", dischargeLitersPerMin: 1300 },
  { id: "ws-27", name: "Tandon Warga Jl. Mayjen Sutoyo", type: "WATER_TANK", coordinates: [-0.4882, 117.1585], status: "READY", dischargeLitersPerMin: 700 },
  { id: "ws-28", name: "Hidran PDAM Posko Induk", type: "HYDRANT", coordinates: [-0.4871, 117.1598], status: "READY", dischargeLitersPerMin: 1800 },
  { id: "ws-29", name: "Dermaga SKM Jembatan Muara", type: "RIVER_DOCK", coordinates: [-0.5052, 117.1508], status: "READY", dischargeLitersPerMin: 3400 },
  { id: "ws-30", name: "Tandon Cadangan Sungai Dama", type: "WATER_TANK", coordinates: [-0.5085, 117.1582], status: "READY", dischargeLitersPerMin: 950 },
];
