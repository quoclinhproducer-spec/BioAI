export type Role = 'ADMINISTRATOR' | 'OPERATOR' | 'VIEWER';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type TelemetryQuality = 'VALID' | 'STALE' | 'INVALID' | 'MISSING';
export type CommandStatus = 'CREATED' | 'SENT' | 'ACKNOWLEDGED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'TIMEOUT';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type BatchPhase =
  | 'INIT'
  | 'ACTIVE_COMPOSTING'
  | 'THERMOPHILIC'
  | 'COOLING'
  | 'CURING'
  | 'COMPLETE'
  | 'SENSOR_FAULT'
  | 'NETWORK_LOST'
  | 'ACTUATOR_FAULT'
  | 'EMERGENCY'
  | 'SAFE_MODE';

export interface Device {
  id: string;
  name: string;
  type: string;
  firmwareVersion: string;
  connectionType: 'MQTT' | 'SERIAL' | 'SIMULATOR';
  status: DeviceStatus;
  lastSeenAt: string;
  location: string;
  batteryLevel: number;
  signalStrength: number;
}

export interface TelemetryRecord {
  deviceId: string;
  sensorKey: string;
  value: number;
  quality: TelemetryQuality;
  timestamp: string;
}

export interface CommandRequestPayload {
  commandId: string;
  actuatorKey: string;
  desiredState: string;
  parameters?: Record<string, unknown>;
}

export interface RealtimeEvent {
  type: 'telemetry' | 'device-status' | 'command' | 'alert' | 'batch' | 'system';
  payload: Record<string, unknown>;
  timestamp: string;
}
