import React, { useState, useRef, useEffect, useCallback } from 'react';
import { triggerHaptic, calculateRingOffset, HOLD_DURATION_MS } from '../utils/haptic';

export { triggerHaptic, calculateRingOffset, HOLD_DURATION_MS };

export interface HapticPressAndHoldButtonProps {
  onTrigger: () => void;
  holdDurationMs?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  triggerLabel?: string;
}

/**
 * Komponen Tombol Darurat Warga 2.0 Detik (Haptic Press-and-Hold)
 * Sesuai docs/Design.md Bagian 5.2 & PRD §7.1:
 * - Bentuk Fisik: Lingkaran diameter 140 px dengan warna dasar #DC2626
 * - Cincin Progres Visual: Lingkaran SVG 6 px yang berputar memenuhi keliling tepat selama 2.000 ms
 * - Umpan Balik Haptic: 40 ms saat disentuh, getaran ganda [100, 50, 150] ms saat 100%
 * - Pembatalan Spontan: Lingkaran progres kembali ke 0 seketika tanpa pengiriman paket jika jari dilepas
 * - Strictly NO pill chips / oval badges
 */
export const HapticPressAndHoldButton: React.FC<HapticPressAndHoldButtonProps> = ({
  onTrigger,
  holdDurationMs = 2000,
  disabled = false,
  className = '',
  label = 'TAHAN 2 DETIK',
  triggerLabel = 'DARURAT',
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<number | boolean>(false);
  const [isTriggered, setIsTriggered] = useState<boolean>(false);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isTriggeredRef = useRef<boolean>(false);

  const radius = 68; // Radius untuk SVG viewbox 152x152 (diameter 136 + stroke 6 + margin)
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const cancelPress = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
    setIsPressing(false);

    if (!isTriggeredRef.current) {
      setProgress(0);
    }
  }, []);

  const handlePressStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (disabled || isTriggeredRef.current) return;

      // Cegah scrolling default pada sentuhan mobile saat menekan tombol darurat
      if ('touches' in e && e.cancelable) {
        // e.preventDefault();
      }

      setIsPressing(true);
      startTimeRef.current = performance.now();

      // Umpan balik haptic awal (40 ms)
      triggerHaptic(40);

      const updateProgress = (currentTime: number) => {
        if (!startTimeRef.current) return;

        const elapsed = currentTime - startTimeRef.current;
        const currentProgress = Math.min(elapsed / holdDurationMs, 1.0);

        setProgress(currentProgress);

        if (currentProgress >= 1.0) {
          // 100% tercapai!
          isTriggeredRef.current = true;
          setIsTriggered(true);
          setIsPressing(false);
          startTimeRef.current = null;

          // Umpan balik haptic ganda tegas (50 ms aktif, 100 ms jeda, 200 ms aktif)
          triggerHaptic([50, 100, 200]);

          onTrigger();
        } else {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateProgress);
    },
    [disabled, holdDurationMs, onTrigger],
  );

  const handlePressEnd = useCallback(() => {
    if (isTriggeredRef.current) return;
    cancelPress();
  }, [cancelPress]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: '156px', height: '156px', touchAction: 'none' }}
    >
      {/* Cincin Progres Visual SVG 6 px */}
      <svg
        className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none"
        viewBox="0 0 156 156"
        aria-hidden="true"
      >
        {/* Track cincin latar belakang redup */}
        <circle
          cx="78"
          cy="78"
          r={radius}
          fill="none"
          stroke="rgba(220, 38, 38, 0.15)"
          strokeWidth="6"
        />
        {/* Cincin progres aktif berputar selama 2.000 ms */}
        <circle
          cx="78"
          cy="78"
          r={radius}
          fill="none"
          stroke="#DC2626"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: isPressing ? 'none' : 'stroke-dashoffset 150ms ease-out',
          }}
        />
      </svg>

      {/* Tombol Fisik Lingkaran Diameter 140 px #DC2626 */}
      <button
        type="button"
        role="button"
        aria-label="Tombol Pelaporan Kebakaran Darurat Tahan 2 Detik"
        aria-pressed={isPressing ? 'true' : 'false'}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        disabled={disabled}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        className={`relative z-10 flex flex-col items-center justify-center rounded-full transition-transform active:scale-95 ${
          disabled
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : isTriggered
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : isPressing
                ? 'bg-red-800 text-white shadow-inner scale-95'
                : 'bg-[#DC2626] text-white hover:bg-red-700 shadow-xl shadow-red-600/35 cursor-pointer'
        }`}
        style={{
          width: '140px',
          height: '140px',
          outline: 'none',
        }}
      >
        {/* Ikon Api / Darurat */}
        <svg
          className={`w-8 h-8 mb-1 transition-transform ${isPressing ? 'scale-110' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
          />
        </svg>

        {/* Teks Status / Progres (No pill chip, pure monospace typography with tabular figures) */}
        <span className="font-mono tabular-nums text-xs font-black tracking-widest uppercase">
          {isTriggered
            ? 'TERKIRIM!'
            : isPressing
              ? `${Math.round(progress * 100)}%`
              : triggerLabel}
        </span>
        <span className="font-mono text-[9px] tracking-wider text-red-200/90 font-medium uppercase mt-0.5">
          {isTriggered ? 'ARAHKAN ARMADA' : label}
        </span>
      </button>
    </div>
  );
};

export default HapticPressAndHoldButton;
