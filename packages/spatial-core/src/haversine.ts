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

