/**
 * @file bearing.ts
 * @description Forward compass bearing calculation for tactical unit navigation towards water sources.
 */

export interface BearingResult {
  bearingDegrees: number;
  cardinalIndonesian: 'U' | 'TL' | 'T' | 'TG' | 'S' | 'BD' | 'B' | 'BL';
  description: string;
}

const CARDINAL_MAP: Array<{ code: BearingResult['cardinalIndonesian']; label: string; min: number; max: number }> = [
  { code: 'U', label: 'Utara', min: 337.5, max: 360 },
  { code: 'U', label: 'Utara', min: 0, max: 22.5 },
  { code: 'TL', label: 'Timur Laut', min: 22.5, max: 67.5 },
  { code: 'T', label: 'Timur', min: 67.5, max: 112.5 },
  { code: 'TG', label: 'Tenggara', min: 112.5, max: 157.5 },
  { code: 'S', label: 'Selatan', min: 157.5, max: 202.5 },
  { code: 'BD', label: 'Barat Daya', min: 202.5, max: 247.5 },
  { code: 'B', label: 'Barat', min: 247.5, max: 292.5 },
  { code: 'BL', label: 'Barat Laut', min: 292.5, max: 337.5 },
];

export function calculateCompassBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): BearingResult {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearingDegrees = Math.round(((theta * 180) / Math.PI + 360) % 360);

  const match = CARDINAL_MAP.find((c) => bearingDegrees >= c.min && bearingDegrees < c.max) ?? CARDINAL_MAP[0];

  return {
    bearingDegrees,
    cardinalIndonesian: match.code,
    description: `${match.label} (${bearingDegrees}°)`,
  };
}
