# Assumptions and Decisions

## UI and design

- Design system: Tailwind CSS + shadcn/ui-inspired component patterns with Radix primitives, Lucide icons, and Recharts for charts.
- Light and dark themes use CSS variables with automatic OS preference and per-user override persistence.
- Vietnamese typography uses a fallback stack that includes `Inter`, `Segoe UI`, and `Helvetica Neue` while preserving diacritics.
- Semantic colors are fixed as green = valid/online/completed, amber = stale/warning/pending, red = invalid/offline/failed/critical, grey = missing/unknown, blue = info/executing. Displays always include an icon and text label.
- All dates are stored in UTC and displayed in the user local time zone. The frontend may convert ISO timestamps to the browser locale.

## Admin gate and authorization

- The admin console is routed under `/admin` in the web app and protected by a server-side administrator role check.
- The backend enforces `ADMINISTRATOR` privileges for user management and settings endpoints.
- Last-active administrator protection is enforced in the API and documented for future enforcement tests.

## Runtime and deployment

- Docker Compose is the standard way to launch the service stack.
- `docker compose up --build` is expected from a clean checkout after the bootstrap script generates `.env` values.
- Bootstrap scripts create `.env` only when absent and avoid overwriting existing values.

## Known constraints

- This repository is being established as a Phase 1 foundation. Some later modules such as full Prisma migrations, simulator telemetry ingestion, and the full admin console are scaffolded, but not yet fully implemented.
- License review for external libraries should be performed before production release.
