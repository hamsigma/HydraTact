import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCompassBearing } from '../src/bearing.ts';

test('Compass Bearing: Titik ke arah utara murni menghasilkan ~0 derajat dan cardinal U', () => {
  const result = calculateCompassBearing(-0.4950, 117.1438, -0.4900, 117.1438);
  assert.equal(result.cardinalIndonesian, 'U');
  assert.equal(result.bearingDegrees, 0);
});

test('Compass Bearing: Titik ke arah timur murni menghasilkan ~90 derajat dan cardinal T', () => {
  const result = calculateCompassBearing(-0.4950, 117.1400, -0.4950, 117.1500);
  assert.equal(result.cardinalIndonesian, 'T');
  assert.equal(result.bearingDegrees, 90);
});

test('Compass Bearing: Skenario Jl. Pelita Gg. 4 ke Dermaga SKM menghasilkan arah Timur/Tenggara yang presisi', () => {
  // Posisi Jl Pelita Gg 4 (-0.4948, 117.1438) ke Sungai Karang Mumus (-0.4955, 117.1465)
  const result = calculateCompassBearing(-0.4948, 117.1438, -0.4955, 117.1465);
  assert.ok(result.bearingDegrees >= 90 && result.bearingDegrees <= 135);
  assert.ok(['T', 'TG'].includes(result.cardinalIndonesian));
});
