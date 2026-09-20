export type UserRole = 'ADMINISTRATOR' | 'OPERATOR' | 'VIEWER';

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  preferredLanguage: 'vi' | 'en';
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface DeviceRecord {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  location: string;
  capability: string[];
}

export interface AuditRecord {
  id: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  data?: Record<string, unknown>;
}
