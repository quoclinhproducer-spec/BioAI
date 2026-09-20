import jwt from 'jsonwebtoken';

export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type TelemetryQuality = 'VALID' | 'STALE' | 'INVALID' | 'MISSING';

export interface TelemetryInput {
  deviceId: string;
  sensorKey: string;
  value: number;
  timestamp: string;
}

export interface SafetyEvaluationInput {
  deviceStatus: DeviceStatus;
  supportedActuator: boolean;
  activeCommandLock: boolean;
  batchSafe: boolean;
  automationEnabled: boolean;
  deviceId: string;
}

export function createAuthToken(userId: string): string {
  const secret = process.env.JWT_ACCESS_SECRET ?? 'bioai-local-dev-secret';
  return jwt.sign({ sub: userId, role: 'ADMINISTRATOR' }, secret, { expiresIn: '15m' });
}

export function loginUser(email: string, password: string) {
  if (email === 'admin@bioai.local' && password === 'password123') {
    return {
      token: createAuthToken('admin-user'),
      user: { id: 'admin-user', email, role: 'ADMINISTRATOR' }
    };
  }

  return null;
}

export function validateTelemetry(input: TelemetryInput) {
  const value = Number(input.value);

  if (!Number.isFinite(value)) {
    return { deviceId: input.deviceId, sensorKey: input.sensorKey, value: input.value, quality: 'INVALID' as TelemetryQuality, timestamp: input.timestamp };
  }

  const sensor = input.sensorKey.toLowerCase();
  const ranges: Record<string, [number, number]> = {
    temperature: [0, 75],
    moisture: [0, 100],
    ph: [0, 14],
    oxygen: [0, 100],
    pressure: [0, 100]
  };

  const range = ranges[sensor] ?? [-1000, 1000];
  const valid = value >= range[0] && value <= range[1];
  const quality: TelemetryQuality = valid ? 'VALID' : 'INVALID';

  return { deviceId: input.deviceId, sensorKey: input.sensorKey, value, quality, timestamp: input.timestamp };
}

export function evaluateSafety(input: SafetyEvaluationInput) {
  if (input.deviceStatus === 'OFFLINE') {
    return { allowed: false, reason: 'Device is offline and cannot receive actuator commands.' };
  }

  if (!input.supportedActuator) {
    return { allowed: false, reason: 'Requested actuator is not supported by this device.' };
  }

  if (input.activeCommandLock) {
    return { allowed: false, reason: 'Another command is already active on the actuator.' };
  }

  if (!input.batchSafe) {
    return { allowed: false, reason: 'Batch is in an unsafe state and cannot accept new commands.' };
  }

  if (!input.automationEnabled) {
    return { allowed: false, reason: 'Automation source is disabled for this command.' };
  }

  return { allowed: true, reason: 'Safety checks passed.' };
}
