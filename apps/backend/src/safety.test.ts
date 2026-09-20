import { describe, expect, it } from 'vitest';
import { evaluateSafety, type DeviceTelemetrySnapshot } from './safety.js';

describe('safety engine', () => {
  it('rejects unsafe high temperature readings with a clear reason', () => {
    const telemetry: DeviceTelemetrySnapshot = {
      deviceId: 'dev-1',
      online: true,
      temperature: 36.5,
      moisture: 58,
      ph: 7.1,
    };

    const result = evaluateSafety(telemetry);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('temperature');
  });

  it('allows telemetry that stays within safe operating ranges', () => {
    const telemetry: DeviceTelemetrySnapshot = {
      deviceId: 'dev-2',
      online: true,
      temperature: 24.5,
      moisture: 54,
      ph: 7.0,
    };

    const result = evaluateSafety(telemetry);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('ok');
  });
});
