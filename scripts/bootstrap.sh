#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
EXAMPLE_FILE="$ROOT_DIR/.env.example"
MOSQUITTO_DIR="$ROOT_DIR/mosquitto/config"

if [ ! -f "$ENV_FILE" ] && [ -f "$EXAMPLE_FILE" ]; then
  cp "$EXAMPLE_FILE" "$ENV_FILE"
  # Keep the defaults but allow the generated values to be replaced by the user if desired.
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" "$ENV_FILE"
  sed -i "s/REFRESH_SECRET=.*/REFRESH_SECRET=$(openssl rand -hex 32)/" "$ENV_FILE"
  sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 24)/" "$ENV_FILE"
  sed -i "s/MQTT_PASSWORD=.*/MQTT_PASSWORD=$(openssl rand -hex 16)/" "$ENV_FILE"
fi

mkdir -p "$MOSQUITTO_DIR"
if [ ! -f "$MOSQUITTO_DIR/mosquitto.passwd" ]; then
  touch "$MOSQUITTO_DIR/mosquitto.passwd"
fi

echo "Bootstrap complete. Ensure the environment is valid before starting Docker."
