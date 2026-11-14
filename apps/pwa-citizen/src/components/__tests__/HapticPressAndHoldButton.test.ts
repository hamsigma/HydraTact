import { describe, it } from 'node:test';
import assert from 'node:assert';
import { triggerHaptic, calculateRingOffset, HOLD_DURATION_MS } from '../../utils/haptic.ts';

describe('TASK-303: Haptic Press-and-Hold Button Specification', () => {
  it('1. triggerHaptic delegates pattern correctly to navigator.vibrate', () => {
    let capturedPattern: number | number[] | null = null;

    // Mock navigator.vibrate pada global navigator yang sudah ada
    Object.defineProperty(globalThis, 'window', {
      value: {},
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis.navigator, 'vibrate', {
      value: (pattern: number | number[]) => {
        capturedPattern = pattern;
        return true;
      },
      configurable: true,
      writable: true,
    });

    // Uji getaran awal (40 ms)
    triggerHaptic(40);
    assert.strictEqual(capturedPattern, 40);

    // Uji getaran ganda tegas saat 100% ([100, 50, 150] ms)
    triggerHaptic([100, 50, 150]);
    assert.deepStrictEqual(capturedPattern, [100, 50, 150]);
  });

  it('2. Circumference and stroke calculations match 140 px button with 6 px SVG ring', () => {
    const radius = 68;

    // Saat progres 0%: offset = keliling penuh (cincin kosong)
    const { circumference, strokeDashoffset: offset0 } = calculateRingOffset(radius, 0.0);
    assert.ok(circumference > 420 && circumference < 435);
    assert.strictEqual(offset0, circumference);

    // Saat progres 50% (1.000 ms): offset = setengah keliling
    const { strokeDashoffset: offset50 } = calculateRingOffset(radius, 0.5);
    assert.strictEqual(offset50, circumference * 0.5);

    // Saat progres 100% (2.000 ms): offset = 0 (cincin penuh)
    const { strokeDashoffset: offset100 } = calculateRingOffset(radius, 1.0);
    assert.strictEqual(offset100, 0);
  });

  it('3. Hold duration is precisely 2,000 ms per Design.md §5.2', () => {
    assert.strictEqual(HOLD_DURATION_MS, 2000);
  });
});
