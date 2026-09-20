import { describe, expect, it } from 'vitest';
import { createTokenPair, isAdmin, verifyAccessToken, type UserRole } from './auth.js';

describe('auth', () => {
  it('issues access and refresh token pairs for a user', () => {
    const tokens = createTokenPair({ id: 'u1', email: 'admin@example.com', role: 'ADMINISTRATOR' as UserRole });
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(verifyAccessToken(tokens.accessToken)?.email).toBe('admin@example.com');
  });

  it('recognizes administrator users and blocks non-admin access', () => {
    expect(isAdmin({ id: 'u1', role: 'ADMINISTRATOR' as UserRole })).toBe(true);
    expect(isAdmin({ id: 'u2', role: 'OPERATOR' as UserRole })).toBe(false);
  });
});
