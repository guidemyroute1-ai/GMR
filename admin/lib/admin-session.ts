'use server';

import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIE = 'gmr_admin_session';
const SECRET = process.env.ADMIN_SESSION_SECRET || 'gmr-admin-secret-changeme';
const SESSION_VALUE = 'admin:authenticated';

function signValue(value: string): string {
  const sig = createHmac('sha256', SECRET).update(value).digest('hex');
  return `${value}.${sig}`;
}

function verifyValue(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.');
  if (lastDot === -1) return null;
  const value = signed.slice(0, lastDot);
  const expected = signValue(value);
  try {
    const a = Buffer.from(signed);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return value;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const value = verifyValue(raw);
  if (value !== SESSION_VALUE) return null;
  return { user: { email: 'admin@guidemyroute.com' }, profile: { role: 'admin', name: 'Admin' } };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  return session;
}

export async function setAdminCookies(_accessToken: string, _refreshToken: string) {
  const cookieStore = await cookies();
  const signed = signValue(SESSION_VALUE);
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearAdminCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

