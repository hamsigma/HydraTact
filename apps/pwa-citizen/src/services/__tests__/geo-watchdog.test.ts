import test from 'node:test';
import assert from 'node:assert/strict';
import { GeolocationWatchdog } from '../geo-watchdog.ts';

test('Geolocation Watchdog Specification', async (t) => {
  await t.test('1. Menangani lingkungan tanpa navigator.geolocation secara anggun', () => {
    const originalNavigator = globalThis.navigator;
    // @ts-expect-error mock
    delete globalThis.navigator;

    try {
      const watchdog = new GeolocationWatchdog();
      const started = watchdog.start();
      assert.equal(started, false);
      assert.equal(watchdog.getStatus().error, 'GEOLOCATION_UNSUPPORTED');
    } finally {
      if (originalNavigator) {
        Object.defineProperty(globalThis, 'navigator', {
          value: originalNavigator,
          configurable: true,
          writable: true,
        });
      }
    }
  });

  await t.test('2. Berhasil memicu callback saat GPS memperbarui koordinat dan mengevaluasi threshold', () => {
    let watchIdCounter = 1;
    let registeredSuccessCallback: ((pos: any) => void) | null = null;

    const mockGeolocation = {
      watchPosition: (success: (pos: any) => void) => {
        registeredSuccessCallback = success;
        return watchIdCounter++;
      },
      clearWatch: () => {},
    };

    Object.defineProperty(globalThis, 'navigator', {
      value: { geolocation: mockGeolocation },
      configurable: true,
      writable: true,
    });

    try {
      const watchdog = new GeolocationWatchdog();
      let lastUpdate: any = null;
      const started = watchdog.start((status) => {
        lastUpdate = status;
      }, 15.0);

      assert.equal(started, true);

      // Trigger high accuracy position
      registeredSuccessCallback!({
        coords: {
          latitude: -0.4948,
          longitude: 117.1438,
          accuracy: 8.5,
        },
      });

      assert.equal(lastUpdate.latitude, -0.4948);
      assert.equal(lastUpdate.longitude, 117.1438);
      assert.equal(lastUpdate.accuracyMeters, 8.5);
      assert.equal(lastUpdate.isHighAccuracy, true);

      // Trigger low accuracy position (> 15m)
      registeredSuccessCallback!({
        coords: {
          latitude: -0.4948,
          longitude: 117.1438,
          accuracy: 45.0,
        },
      });

      assert.equal(lastUpdate.accuracyMeters, 45.0);
      assert.equal(lastUpdate.isHighAccuracy, false);

      watchdog.stop();
      assert.equal(watchdog.getStatus().isMonitoring, false);
    } finally {
      // @ts-expect-error cleanup
      delete globalThis.navigator;
    }
  });
});
