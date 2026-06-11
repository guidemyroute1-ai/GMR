'use server';

import { redirect } from 'next/navigation';
import { clearAdminCookies, setAdminCookies } from './admin-session';
import { supabaseAdmin } from './supabase-server';

export async function loginAdmin(_prevState: { error?: string } | undefined, formData: FormData) {
  const username = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!username || !password) return { error: 'Username and password are required.' };

  if (username !== 'admin' || password !== 'admin123') {
    return { error: 'Invalid login credentials.' };
  }

  // Map to the actual Supabase admin user we created to ensure sessions still work properly under the hood
  const email = 'admin@guidemyroute.com';

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    return { error: error?.message || 'Unable to sign in.' };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'admin') {
    return { error: 'This account does not have admin access.' };
  }

  await setAdminCookies(data.session.access_token, data.session.refresh_token);
  redirect('/dashboard');
}

export async function logoutAdmin() {
  await clearAdminCookies();
  redirect('/login');
}

