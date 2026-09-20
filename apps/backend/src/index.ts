import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createTokenPair, isAdmin, verifyAccessToken, type AuthUser } from './auth.js';
import { evaluateSafety } from './safety.js';
import type { AuditRecord, DeviceRecord, UserRecord } from './types.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

const users: UserRecord[] = [
  {
    id: 'admin-1',
    email: 'admin@bioai.local',
    displayName: 'System Admin',
    role: 'ADMINISTRATOR',
    isActive: true,
    preferredLanguage: 'en',
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'op-1',
    email: 'operator@bioai.local',
    displayName: 'Shift Operator',
    role: 'OPERATOR',
    isActive: true,
    preferredLanguage: 'vi',
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'viewer-1',
    email: 'viewer@bioai.local',
    displayName: 'Plant Viewer',
    role: 'VIEWER',
    isActive: true,
    preferredLanguage: 'en',
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  },
];

const devices: DeviceRecord[] = [
  { id: 'dev-1', name: 'Bioreactor A1', status: 'ONLINE', location: 'Line 1', capability: ['TEMPERATURE', 'PH', 'MIXER'] },
  { id: 'dev-2', name: 'Dryer D3', status: 'OFFLINE', location: 'Line 2', capability: ['TEMPERATURE', 'MOISTURE'] },
  { id: 'dev-3', name: 'Pump Station P9', status: 'ONLINE', location: 'Utilities', capability: ['FLOW', 'PRESSURE'] },
];

const auditLog: AuditRecord[] = [
  { id: 'audit-1', actorUserId: 'admin-1', action: 'user.login', entityType: 'user', entityId: 'admin-1', createdAt: new Date().toISOString(), data: { result: 'success' } },
];

const settings = new Map<string, unknown>([
  ['defaultLivenessTimeoutSeconds', 180],
  ['alertOfflineDurationMinutes', 15],
  ['defaultLanguage', 'vi'],
  ['commandTimeoutSeconds', 90],
]);

const rules = [
  { id: 'rule-temp', name: 'Temperature ceiling', enabled: true, severity: 'critical', scope: 'DEVICE', message: 'Reject any reading above 35°C' },
  { id: 'rule-ph', name: 'pH band', enabled: true, severity: 'critical', scope: 'DEVICE', message: 'Reject readings outside 5.8–8.5' },
  { id: 'rule-moisture', name: 'Moisture guard', enabled: false, severity: 'warning', scope: 'DEVICE', message: 'Warn when moisture moves outside 20–80%' },
];

const alerts = [
  { id: 'alert-1', deviceId: 'dev-2', severity: 'warning', status: 'open', message: 'Dryer D3 reported stale telemetry at 02:10', source: 'SYSTEM' },
  { id: 'alert-2', deviceId: 'dev-1', severity: 'critical', status: 'open', message: 'Temperature exceeded threshold', source: 'SAFETY_ENGINE' },
];

const commands = [
  { id: 'cmd-1', deviceId: 'dev-1', action: 'cooling.set', status: 'COMPLETED', source: 'OPERATOR', createdAt: new Date().toISOString() },
  { id: 'cmd-2', deviceId: 'dev-2', action: 'dryer.pause', status: 'PENDING', source: 'AUTO', createdAt: new Date().toISOString() },
];

function authUserFromHeader(req: Request) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload) return null;
  const user = users.find((entry) => entry.id === payload.sub);
  if (!user || !user.isActive) return null;
  return { id: user.id, email: user.email, role: user.role, displayName: user.displayName } satisfies AuthUser;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = authUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  (req as Request & { user?: AuthUser }).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!isAdmin(user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'bioai-backend', time: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email ?? '').toLowerCase();
  const password = String(req.body?.password ?? '');

  const user = users.find((entry) => entry.email.toLowerCase() === email && password.length > 0);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const tokens = createTokenPair({ id: user.id, email: user.email, role: user.role, displayName: user.displayName });
  user.lastLoginAt = new Date().toISOString();
  auditLog.unshift({
    id: `audit-${Date.now()}`,
    actorUserId: user.id,
    action: 'user.login',
    entityType: 'user',
    entityId: user.id,
    createdAt: new Date().toISOString(),
    data: { email: user.email },
  });

  return res.json({ user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName }, ...tokens });
});

app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null;
  if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET ?? 'bioai-dev-secret', { issuer: 'bioai' }) as { sub: string; email: string };
    const user = users.find((entry) => entry.id === payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Refresh token invalid' });
    }
    const tokens = createTokenPair({ id: user.id, email: user.email, role: user.role, displayName: user.displayName });
    return res.json(tokens);
  } catch {
    return res.status(401).json({ error: 'Refresh token invalid' });
  }
});

app.post('/api/auth/logout', requireAuth, (_req, res) => {
  res.json({ ok: true, message: 'Logged out' });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const current = String(req.body?.currentPassword ?? '');
  const next = String(req.body?.newPassword ?? '');
  if (!current || !next) return res.status(400).json({ error: 'Missing password data' });
  const user = users.find((entry) => entry.id === (req as Request & { user?: AuthUser }).user?.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.mustChangePassword = false;
  return res.json({ ok: true, message: 'Password updated' });
});

app.get('/api/users', requireAuth, requireAdmin, (_req, res) => {
  res.json(users);
});

app.get('/api/users/:id', requireAuth, (req, res) => {
  const user = users.find((entry) => entry.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

app.post('/api/users', requireAuth, requireAdmin, (req, res) => {
  const body = req.body ?? {};
  const nextUser: UserRecord = {
    id: `user-${Date.now()}`,
    email: String(body.email ?? 'new-user@bioai.local'),
    displayName: String(body.displayName ?? 'New user'),
    role: body.role ?? 'VIEWER',
    isActive: body.isActive ?? true,
    preferredLanguage: body.preferredLanguage ?? 'en',
    mustChangePassword: body.mustChangePassword ?? true,
    createdAt: new Date().toISOString(),
  };
  users.push(nextUser);
  auditLog.unshift({ id: `audit-${Date.now()}`, actorUserId: (req as Request & { user?: AuthUser }).user?.id, action: 'user.create', entityType: 'user', entityId: nextUser.id, createdAt: new Date().toISOString(), data: { email: nextUser.email } });
  return res.status(201).json(nextUser);
});

app.patch('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  const user = users.find((entry) => entry.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  Object.assign(user, req.body);
  auditLog.unshift({ id: `audit-${Date.now()}`, actorUserId: (req as Request & { user?: AuthUser }).user?.id, action: 'user.update', entityType: 'user', entityId: user.id, createdAt: new Date().toISOString(), data: { before: user, after: req.body } });
  return res.json(user);
});

app.post('/api/users/:id/reset-password', requireAuth, requireAdmin, (req, res) => {
  const user = users.find((entry) => entry.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.mustChangePassword = true;
  return res.json({ ok: true, message: `Password reset for ${user.email}` });
});

app.post('/api/users/:id/deactivate', requireAuth, requireAdmin, (req, res) => {
  const user = users.find((entry) => entry.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'ADMINISTRATOR' && users.filter((entry) => entry.isActive && entry.role === 'ADMINISTRATOR').length <= 1) {
    return res.status(400).json({ error: 'Last administrator cannot be deactivated' });
  }
  user.isActive = false;
  return res.json({ ok: true, message: `${user.email} deactivated` });
});

app.post('/api/users/:id/activate', requireAuth, requireAdmin, (req, res) => {
  const user = users.find((entry) => entry.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isActive = true;
  return res.json({ ok: true, message: `${user.email} activated` });
});

app.get('/api/devices', requireAuth, (_req, res) => {
  res.json(devices);
});

app.get('/api/devices/:id', requireAuth, (req, res) => {
  const device = devices.find((entry) => entry.id === req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

app.get('/api/audit-logs', requireAuth, requireAdmin, (_req, res) => {
  res.json(auditLog);
});

app.get('/api/system/settings', requireAuth, requireAdmin, (_req, res) => {
  res.json(Object.fromEntries(settings));
});

app.put('/api/system/settings', requireAuth, requireAdmin, (req, res) => {
  const next = req.body ?? {};
  Object.entries(next).forEach(([key, value]) => settings.set(key, value));
  return res.json(Object.fromEntries(settings));
});

app.get('/api/system/health', requireAuth, requireAdmin, (_req, res) => {
  res.json({
    status: 'healthy',
    database: 'ready',
    websocket: 'ready',
    mqtt: 'ready',
    uptime: '0d 00:00:00',
  });
});

app.get('/api/operations/summary', requireAuth, (_req, res) => {
  const safetyResult = evaluateSafety({ deviceId: 'dev-1', online: true, temperature: 36.5, moisture: 57, ph: 7.1 });
  res.json({
    devicesOnline: devices.filter((device) => device.status === 'ONLINE').length,
    alertsOpen: alerts.filter((alert) => alert.status === 'open').length,
    rulesEnabled: rules.filter((rule) => rule.enabled).length,
    lastSafetyCheck: safetyResult,
  });
});

app.get('/api/rules', requireAuth, (_req, res) => {
  res.json(rules);
});

app.post('/api/rules/:id/toggle', requireAuth, requireAdmin, (req, res) => {
  const rule = rules.find((entry) => entry.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  rule.enabled = !rule.enabled;
  return res.json(rule);
});

app.get('/api/alerts', requireAuth, (_req, res) => {
  res.json(alerts);
});

app.post('/api/alerts/:id/acknowledge', requireAuth, (req, res) => {
  const alert = alerts.find((entry) => entry.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.status = 'acknowledged';
  return res.json(alert);
});

app.get('/api/commands', requireAuth, (_req, res) => {
  res.json(commands);
});

app.post('/api/commands', requireAuth, (req, res) => {
  const body = req.body ?? {};
  const snapshot = {
    deviceId: String(body.deviceId ?? 'dev-1'),
    online: body.online ?? true,
    temperature: Number(body.temperature ?? 25),
    moisture: Number(body.moisture ?? 55),
    ph: Number(body.ph ?? 7),
    oxygen: Number(body.oxygen ?? 21),
  };

  const safety = evaluateSafety(snapshot);
  if (!safety.allowed) {
    return res.status(400).json({ error: 'Command rejected by safety engine', reason: safety.reason, severity: safety.severity });
  }

  const record = {
    id: `cmd-${Date.now()}`,
    deviceId: snapshot.deviceId,
    action: String(body.action ?? 'status.refresh'),
    status: 'SENT',
    source: String(body.source ?? 'OPERATOR'),
    createdAt: new Date().toISOString(),
  };

  commands.unshift(record);
  return res.status(201).json(record);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

app.listen(port, () => {
  console.log(`BioAI backend listening on http://localhost:${port}`);
});

export { app };
