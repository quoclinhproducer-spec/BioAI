const mqtt = require('mqtt');
const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log(`Simulator connected to ${brokerUrl}`);
  setInterval(() => {
    const payload = JSON.stringify({
      ts: new Date().toISOString(),
      device: 'simulator-1',
      temperature: 24.3 + Math.random() * 2,
      moisture: 55.5 + Math.random() * 5,
    });
    client.publish('devices/telemetry', payload);
  }, 5000);
});
