import { describe, expect, it } from 'vitest';
import { createAuthToken, validateTelemetry, evaluateSafety } from './logic.js';

describe('BioAI backend logic', () => {
  it('authenticates a valid user and returns a token', () => {
    const token = createAuthToken('user-1');
    expect(token).toBeTypeOf('string');
    expect(token.length).toBeGreaterThan(10);
  });

  it('accepts valid temperature telemetry and marks it valid', () => {
    const result = validateTelemetry({
      deviceId: 'dev-1',
      sensorKey: 'temperature',
      value: 38,
      timestamp: new Date().toISOString()
    });

    expect(result.quality).toBe('VALID');
  });

  it('rejects commands when the device is offline', () => {
    const decision = evaluateSafety({
      deviceStatus: 'OFFLINE',
      supportedActuator: true,
      activeCommandLock: false,
      batchSafe: true,
      automationEnabled: true,
      deviceId: 'dev-1'
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('offline');
  });
});
