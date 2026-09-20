import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import mqtt from 'mqtt';
import { Server as SocketIOServer } from 'socket.io';
import { evaluateSafety, loginUser, validateTelemetry } from './logic.js';

dotenv.config({ path: '../../.env' });

type DeviceRecord = {
  id: string;
  name: string;
  type: string;
  firmwareVersion: string;
  connectionType: 'MQTT' | 'SERIAL' | 'SIMULATOR';
  status: 'ONLINE' | 'OFFLINE';
  lastSeenAt: string;
  location: string;
  batteryLevel: number;
  signalStrength: number;
};

type DeviceTelemetry = {
  deviceId: string;
  sensorKey: string;
  value: number;
  quality: 'VALID' | 'STALE' | 'INVALID' | 'MISSING';
  timestamp: string;
};

type CommandLog = {
  id: string;
  deviceId: string;
  actuatorKey: string;
  desiredState: string;
  status: 'CREATED' | 'SENT' | 'ACKNOWLEDGED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'TIMEOUT';
  createdAt: string;
  rejectionReason?: string;
};

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

const devices: DeviceRecord[] = [
  {
    id: 'dev-1',
    name: 'Compost Cell 1',
    type: 'Composter',
    firmwareVersion: '1.0.0',
    connectionType: 'SIMULATOR',
    status: 'ONLINE',
    lastSeenAt: new Date().toISOString(),
    location: 'North Bay',
    batteryLevel: 92,
    signalStrength: -42
  },
  {
    id: 'dev-2',
    name: 'Compost Cell 2',
    type: 'Composter',
    firmwareVersion: '1.0.0',
    connectionType: 'SIMULATOR',
    status: 'OFFLINE',
    lastSeenAt: new Date(Date.now() - 180000).toISOString(),
    location: 'South Bay',
    batteryLevel: 43,
    signalStrength: -78
  }
];

const telemetryStore: Record<string, DeviceTelemetry[]> = {
  'dev-1': [],
  'dev-2': []
};

const commands: CommandLog[] = [];

app.use(cors());
app.use(express.json());

function broadcast(eventName: string, payload: Record<string, unknown>) {
  io.emit(eventName, { ...payload, timestamp: new Date().toISOString() });
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bioai-backend' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const user = loginUser(String(email ?? ''), String(password ?? ''));

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json(user);
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  return res.json({ id: 'admin-user', email: 'admin@bioai.local', role: 'ADMINISTRATOR', token });
});

app.get('/api/devices', (_req, res) => {
  res.json(devices);
});

app.post('/api/devices', (req, res) => {
  const payload = req.body ?? {};
  const device: DeviceRecord = {
    id: payload.id ?? `dev-${Date.now()}`,
    name: payload.name ?? 'New Device',
    type: payload.type ?? 'Composter',
    firmwareVersion: payload.firmwareVersion ?? '1.0.0',
    connectionType: payload.connectionType ?? 'MQTT',
    status: payload.status ?? 'OFFLINE',
    lastSeenAt: new Date().toISOString(),
    location: payload.location ?? 'Unknown',
    batteryLevel: Number(payload.batteryLevel ?? 0),
    signalStrength: Number(payload.signalStrength ?? -60)
  };

  devices.push(device);
  telemetryStore[device.id] = [];
  broadcast('device-status', { deviceId: device.id, status: device.status });
  res.status(201).json(device);
});

app.get('/api/devices/:id', (req, res) => {
  const found = devices.find((device) => device.id === req.params.id);
  if (!found) {
    return res.status(404).json({ message: 'Device not found' });
  }
  return res.json(found);
});

app.patch('/api/devices/:id', (req, res) => {
  const found = devices.find((device) => device.id === req.params.id);
  if (!found) {
    return res.status(404).json({ message: 'Device not found' });
  }

  Object.assign(found, req.body, { updatedAt: new Date().toISOString() });
  broadcast('device-status', { deviceId: found.id, status: found.status });
  return res.json(found);
});

app.get('/api/devices/:id/telemetry', (req, res) => {
  const list = telemetryStore[req.params.id] ?? [];
  res.json(list.slice(-50));
});

app.post('/api/commands', (req, res) => {
  const payload = req.body ?? {};
  const decision = evaluateSafety({
    deviceStatus: devices.find((device) => device.id === payload.deviceId)?.status ?? 'OFFLINE',
    supportedActuator: true,
    activeCommandLock: false,
    batchSafe: true,
    automationEnabled: true,
    deviceId: payload.deviceId ?? 'unknown'
  });

  const command: CommandLog = {
    id: payload.commandId ?? `cmd-${Date.now()}`,
    deviceId: payload.deviceId ?? 'unknown',
    actuatorKey: payload.actuatorKey ?? 'blower',
    desiredState: payload.desiredState ?? 'ON',
    status: decision.allowed ? 'SENT' : 'REJECTED',
    createdAt: new Date().toISOString(),
    rejectionReason: decision.allowed ? undefined : decision.reason
  };

  commands.push(command);
  if (!decision.allowed) {
    broadcast('command', { commandId: command.id, status: 'REJECTED', reason: decision.reason });
    return res.status(400).json({ message: 'Command rejected by Safety Engine', command, decision });
  }

  broadcast('command', { commandId: command.id, status: 'SENT' });
  return res.status(201).json({ command, decision });
});

app.get('/api/commands/:id', (req, res) => {
  const command = commands.find((entry) => entry.id === req.params.id);
  if (!command) {
    return res.status(404).json({ message: 'Command not found' });
  }
  res.json(command);
});

app.get('/api/devices/:id/commands', (req, res) => {
  res.json(commands.filter((entry) => entry.deviceId === req.params.id));
});

app.get('/api/alerts', (_req, res) => {
  res.json([{ id: 'alert-1', type: 'OFFLINE', severity: 'WARNING', status: 'OPEN', message: 'Device offline state detected' }]);
});

app.patch('/api/alerts/:id', (req, res) => {
  res.json({ id: req.params.id, ...req.body, status: 'ACKNOWLEDGED' });
});

app.post('/api/telemetry', (req, res) => {
  const payload = req.body ?? {};
  const event = validateTelemetry({
    deviceId: String(payload.deviceId ?? 'unknown'),
    sensorKey: String(payload.sensorKey ?? 'temperature'),
    value: Number(payload.value ?? 0),
    timestamp: String(payload.timestamp ?? new Date().toISOString())
  });

  const list = telemetryStore[event.deviceId] ?? [];
  list.push(event);
  telemetryStore[event.deviceId] = list.slice(-200);

  broadcast('telemetry', { deviceId: event.deviceId, sensorKey: event.sensorKey, quality: event.quality, value: event.value });
  return res.status(201).json(event);
});

app.get('/realtime', (_req, res) => {
  res.send('Realtime endpoint ready');
});

const brokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
const mqttUsername = process.env.MQTT_USERNAME ?? 'bioai';
const mqttPassword = process.env.MQTT_PASSWORD ?? 'change_me';

let mqttClient: mqtt.MqttClient | null = null;

function connectMqtt() {
  try {
    mqttClient = mqtt.connect(brokerUrl, {
      username: mqttUsername,
      password: mqttPassword,
      reconnectPeriod: 5000
    });

    mqttClient.on('connect', () => {
      console.log('MQTT connected');
      mqttClient?.subscribe('bioai/devices/+/telemetry');
      mqttClient?.subscribe('bioai/devices/+/status');
    });

    mqttClient.on('message', (_topic, messageBuffer) => {
      const topic = _topic.toString();
      const raw = messageBuffer.toString();
      try {
        const payload = JSON.parse(raw);
        if (topic.includes('/telemetry')) {
          const event = validateTelemetry({
            deviceId: topic.split('/')[2] ?? 'unknown',
            sensorKey: String(payload.sensorKey ?? 'temperature'),
            value: Number(payload.value ?? 0),
            timestamp: String(payload.timestamp ?? new Date().toISOString())
          });
          const store = telemetryStore[event.deviceId] ?? [];
          store.push(event);
          telemetryStore[event.deviceId] = store.slice(-200);
          broadcast('telemetry', { deviceId: event.deviceId, sensorKey: event.sensorKey, quality: event.quality, value: event.value });
        }
      } catch (error) {
        console.error('MQTT payload parsing error', error);
      }
    });

    mqttClient.on('error', (error) => {
      console.warn('MQTT unavailable; backend continues in degraded mode.', error.message);
    });
  } catch (error) {
    console.warn('MQTT client init failed; continuing without live broker.', error instanceof Error ? error.message : String(error));
  }
}

io.on('connection', (socket) => {
  socket.emit('system', { message: 'Connected to BioAI realtime server' });
  socket.on('ping', () => socket.emit('pong', { ok: true }));
});

connectMqtt();

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  console.log(`BioAI backend running on http://localhost:${port}`);
});

export { app, broadcast, devices, telemetryStore, commands };
