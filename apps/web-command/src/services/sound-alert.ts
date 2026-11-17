/**
 * @file sound-alert.ts
 * @description Tactical Audio Alert for Posko Command Center using Web Audio API synthesis.
 */

export interface SoundAlertOptions {
  frequencyHz?: number;
  durationMs?: number;
  volume?: number;
}

export function playTacticalAlert(options: SoundAlertOptions = {}): boolean {
  if (typeof window === 'undefined') return false;

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return false;

  try {
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq = options.frequencyHz ?? 880; // 880Hz (A5 high alert)
    const duration = (options.durationMs ?? 300) / 1000;
    const vol = Math.min(Math.max(options.volume ?? 0.2, 0), 1.0);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Smooth envelope attack and decay to prevent audio popping
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);

    return true;
  } catch {
    return false;
  }
}
