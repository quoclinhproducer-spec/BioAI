import dotenv from 'dotenv';
import mqtt from 'mqtt';

dotenv.config({ path: '../../.env' });

const deviceId = process.env.SIMULATOR_DEVICE_ID ?? 'dev-1';
const brokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
const username = process.env.MQTT_USERNAME ?? 'bioai';
const password = process.env.MQTT_PASSWORD ?? 'change_me';

const client = mqtt.connect(brokerUrl, {
  username,
  password,
  reconnectPeriod: 5000
});

let tick = 0;

function publishTelemetry() {
  const value = 32 + Math.sin(tick / 4) * 10 + (tick % 9) * 0.7;
  const payload = {
    sensorKey: 'temperature',
    value: Number(value.toFixed(2)),
    timestamp: new Date().toISOString()
  };

  client.publish(`bioai/devices/${deviceId}/telemetry`, JSON.stringify(payload));
  client.publish(`bioai/devices/${deviceId}/status`, JSON.stringify({ status: 'ONLINE', ts: new Date().toISOString() }));
  tick += 1;
}

client.on('connect', () => {
  console.log(`Simulator connected to ${brokerUrl}`);
  client.subscribe(`bioai/devices/${deviceId}/command`);
  setInterval(publishTelemetry, 5000);
  publishTelemetry();
});

client.on('message', (topic, message) => {
  console.log(`Simulator received command on ${topic}: ${message.toString()}`);
  const response = {
    commandId: 'sim-cmd-1',
    status: 'ACKNOWLEDGED',
    detail: 'Command received by simulator.'
  };

  client.publish(`bioai/devices/${deviceId}/command/ack`, JSON.stringify(response));
});

client.on('error', (error) => {
  console.warn('Simulator MQTT error; real broker unavailable in this environment.', error.message);
});

console.log('BioAI simulator starting...');
