import { describe, expect, it } from 'vitest';
import { evaluatePlatformStatus, evaluateReleaseReadiness } from './platform.js';

describe('platform administration layer', () => {
  it('marks the platform as green when the core services are healthy', () => {
    const status = evaluatePlatformStatus({
      totalDevices: 30,
      onlineDevices: 28,
      criticalAlerts: 1,
      androidSyncHealthy: true,
      releaseVersion: '2.5.0',
    });

    expect(status.status).toBe('GREEN');
    expect(status.deploymentReady).toBe(true);
  });

  it('blocks release readiness when the Android sync is unhealthy', () => {
    const readiness = evaluateReleaseReadiness({
      webVersion: '2.5.0',
      androidVersion: '2.4.2',
      androidSyncHealthy: false,
      criticalAlerts: 0,
      onlineDevices: 24,
      totalDevices: 30,
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.reason).toMatch(/android|sync/i);
  });
});
