/**
 * Helper umpan balik haptic aman (Vibration API)
 * Sesuai docs/Design.md §5.2:
 * - 40 ms saat jari pertama kali menyentuh tombol
 * - [100, 50, 150] ms saat progres 100% tercapai
 */
export const triggerHaptic = (pattern: number | number[]): void => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Abaikan jika browser membatasi haptic
    }
  }
};

/**
 * Menghitung stroke dashoffset untuk cincin progres SVG
 * @param radius Radius lingkaran SVG (default: 68 px)
 * @param progress Progres penahanan 0.0 s.d. 1.0
 */
export const calculateRingOffset = (
  radius: number,
  progress: number,
): { circumference: number; strokeDashoffset: number } => {
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = circumference - clampedProgress * circumference;
  return { circumference, strokeDashoffset };
};

export const HOLD_DURATION_MS = 2000;
