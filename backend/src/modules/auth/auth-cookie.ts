import type { CookieOptions, Response } from 'express';

export type AuthAudience = 'customer' | 'admin';

const secure = process.env.NODE_ENV === 'production';
const baseOptions: CookieOptions = { httpOnly: true, secure, sameSite: 'strict' };

export const authCookieNames = (audience: AuthAudience) => ({
  access: `${audience}_access`,
  refresh: `${audience}_refresh`,
});

export const authCookieOptions = (audience: AuthAudience) => ({
  access: { ...baseOptions, path: audience === 'admin' ? '/api/v1/admin' : '/api/v1', maxAge: 15 * 60 * 1000 },
  refresh: { ...baseOptions, path: audience === 'admin' ? '/api/v1/admin/auth/refresh' : '/api/v1/auth/refresh', maxAge: 7 * 24 * 60 * 60 * 1000 },
});

export function setAuthCookies(res: Response, audience: AuthAudience, tokens: { accessToken: string; refreshToken: string }) {
  const names = authCookieNames(audience);
  const options = authCookieOptions(audience);
  res.cookie(names.access, tokens.accessToken, options.access);
  res.cookie(names.refresh, tokens.refreshToken, options.refresh);
}

export function clearAuthCookies(res: Response, audience: AuthAudience) {
  const names = authCookieNames(audience);
  const options = authCookieOptions(audience);
  const { maxAge: _accessMaxAge, ...accessOptions } = options.access;
  const { maxAge: _refreshMaxAge, ...refreshOptions } = options.refresh;
  res.clearCookie(names.access, accessOptions);
  res.clearCookie(names.refresh, refreshOptions);
}
