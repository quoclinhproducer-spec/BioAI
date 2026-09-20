export type DeviceTelemetrySnapshot = {
  deviceId: string;
  online: boolean;
  temperature?: number;
  moisture?: number;
  ph?: number;
  oxygen?: number;
};

export type SafetyResult = {
  allowed: boolean;
  reason: string;
  severity: 'ok' | 'warning' | 'critical';
};

export function evaluateSafety(snapshot: DeviceTelemetrySnapshot): SafetyResult {
  if (!snapshot.online) {
    return { allowed: false, reason: 'device offline', severity: 'critical' };
  }

  if (typeof snapshot.temperature === 'number' && snapshot.temperature > 35) {
    return { allowed: false, reason: 'temperature above safe operating range', severity: 'critical' };
  }

  if (typeof snapshot.moisture === 'number' && (snapshot.moisture > 80 || snapshot.moisture < 20)) {
    return { allowed: false, reason: 'moisture outside safe operating range', severity: 'critical' };
  }

  if (typeof snapshot.ph === 'number' && (snapshot.ph < 5.8 || snapshot.ph > 8.5)) {
    return { allowed: false, reason: 'ph outside safe operating range', severity: 'critical' };
  }

  if (typeof snapshot.oxygen === 'number' && snapshot.oxygen < 18) {
    return { allowed: false, reason: 'oxygen below safety threshold', severity: 'critical' };
  }

  return { allowed: true, reason: 'ok', severity: 'ok' };
}
