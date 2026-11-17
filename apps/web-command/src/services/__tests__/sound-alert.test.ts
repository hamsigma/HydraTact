import test from 'node:test';
import assert from 'node:assert/strict';
import { playTacticalAlert } from '../sound-alert.ts';

test('Tactical Sound Alert Specification', async (t) => {
  await t.test('1. Mengembalikan false dengan aman di lingkungan headless/SSR (tanpa window.AudioContext)', () => {
    const result = playTacticalAlert({ frequencyHz: 880 });
    assert.equal(result, false);
  });

  await t.test('2. Berhasil memicu synthesizer audio saat AudioContext tersedia', () => {
    let oscillatorStarted = false;
    let oscillatorStopped = false;

    const mockOscillator = {
      type: '',
      frequency: { setValueAtTime: () => {} },
      connect: () => {},
      start: () => { oscillatorStarted = true; },
      stop: () => { oscillatorStopped = true; },
    };

    const mockGain = {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };

    class MockAudioContext {
      currentTime = 0;
      destination = {};
      createOscillator() { return mockOscillator; }
      createGain() { return mockGain; }
    }

    Object.defineProperty(globalThis, 'window', {
      value: { AudioContext: MockAudioContext },
      writable: true,
      configurable: true,
    });

    try {
      const result = playTacticalAlert({ frequencyHz: 880, durationMs: 250, volume: 0.3 });
      assert.equal(result, true);
      assert.equal(oscillatorStarted, true);
      assert.equal(oscillatorStopped, true);
    } finally {
      // @ts-expect-error cleanup window
      delete globalThis.window;
    }
  });
});
