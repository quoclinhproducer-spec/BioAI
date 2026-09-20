# BioAI

BioAI is a production-oriented industrial monitoring and operations platform for biomass and process automation. This repository provides the scaffolding for the Phase 1 foundation required by the BioAI Master Build Specification addendum.

## Prerequisites

- Node.js 20 LTS or newer
- npm
- Docker Desktop or Docker Engine with Compose v2
- Git

## Quick start

1. Copy `.env.example` to `.env` if missing.
2. Run the bootstrap script:
   - Linux/macOS: `bash scripts/bootstrap.sh`
   - Windows PowerShell: `powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1`
3. Start the stack:
   - `docker compose up --build`
4. Open the app:
   - Web: `http://localhost:3000`
   - Backend API: `http://localhost:4000/health`
   - MQTT broker: `mqtt://localhost:1883`

## Stop and reset

- Stop: `docker compose down`
- Reset volumes: `docker compose down -v`
- Remove build cache: `docker compose build --no-cache`

## Test commands

- Backend tests: `npm test --workspace @bioai/backend`
- Frontend build: `npm run build --workspace @bioai/web`

## Important notes

- The repository intentionally follows the Phase 1 specification by providing the admin/user auth shell, Docker base stack, and the required evidence and project docs.
- Full Phase 2+ modules remain to be implemented in later work.
