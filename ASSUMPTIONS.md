# BioAI Assumptions and Defaults

## General Assumptions
- This project uses a monorepo structure with independent frontend, backend, simulator, and shared packages.
- TypeScript is the default language for backend and shared packages; Next.js and TypeScript are used on the web frontend.
- The repository is expected to run locally when Docker is available; this session cannot verify live infrastructure because Docker is not installed.

## Selected Defaults
1. Realtime transport: Socket.IO
   - Reason: it gives a clear WebSocket-compatible event layer with a widely used Node.js stack and easier event-driven frontend integration.
   - Affected subsystem: realtime communication, frontend telemetry updates.
   - Can change later: yes.

2. MQTT command timeout: 15 seconds
   - Reason: short but realistic for local simulator command acknowledgements and operational feedback.
   - Affected subsystem: Safety Engine, command lifecycle, simulator.
   - Can change later: yes.

3. Device offline timeout: 45 seconds since last successful telemetry or status update
   - Reason: allows short network jitter while still producing eventual offline state in real usage.
   - Affected subsystem: device liveness inference and device dashboard.
   - Can change later: yes.

4. Vision module status: BLOCKED by missing credential / runtime dependency
   - Reason: this environment does not provide a usable vision provider credential or a proven local model runtime, and no Docker-based model host is available.
   - Affected subsystem: AI vision recognition.
   - Can change later: yes, when a credential or local model path is available.
   - Required unblocking setup: a valid provider such as `GOOGLE_VISION_API_KEY` or a locally downloadable model with sufficient memory and network access.

5. Default batch thresholds and process durations
   - Reason: specification leaves process thresholds undefined. The defaults follow practical operational values for composting telemetry.
   - Affected subsystem: batch state engine and process intelligence.
   - Can change later: yes.

## Operational Notes
- AI outputs are treated as traceable results and never as direct actuator commands.
- Safety decisions remain server-side authoritative, even in simulator mode.
- All user-visible strings should be pulled from translation resources, even though the first implementation will use a small default i18n setup in the web app.
