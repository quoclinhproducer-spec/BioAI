import jwt from 'jsonwebtoken';

export type UserRole = 'ADMINISTRATOR' | 'OPERATOR' | 'VIEWER';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
};

const JWT_SECRET = process.env.JWT_SECRET ?? 'bioai-dev-secret';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

export function createTokenPair(user: AuthUser) {
  const accessToken = jwt.sign({ sub: user.id, id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: 'bioai',
  });

  const refreshToken = jwt.sign({ sub: user.id, type: 'refresh', email: user.email }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
    issuer: 'bioai',
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: 'bioai' }) as {
      sub: string;
      id: string;
      email: string;
      role: UserRole;
      iat?: number;
      exp?: number;
    };
  } catch {
    return null;
  }
}

type AdminCheckUser = {
  id?: string;
  role?: UserRole;
};

export function isAdmin(user?: AdminCheckUser | null): boolean {
  return user?.role === 'ADMINISTRATOR';
}

export function requireAdmin(user?: AdminCheckUser | null): void {
  if (!isAdmin(user)) {
    throw new Error('Forbidden');
  }
}
