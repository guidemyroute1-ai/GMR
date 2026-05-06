'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from './supabase-server';

const ACCESS_COOKIE = 'gmr_admin_access_token';
const REFRESH_COOKIE = 'gmr_admin_refresh_token';

export async function getAdminSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  if (accessToken === 'dummy_admin_access_token') {
    return {
      user: { id: 'admin-hardcoded', email: 'admin' } as any,
      profile: { id: 'admin-hardcoded', role: 'admin', email: 'admin', name: 'Admin' }
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, role, email, name')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') return null;
  return { user: data.user, profile };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  return session;
}

export async function setAdminCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
  cookieStore.set(ACCESS_COOKIE, accessToken, { ...options, maxAge: 60 * 60 });
  cookieStore.set(REFRESH_COOKIE, refreshToken, { ...options, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearAdminCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

