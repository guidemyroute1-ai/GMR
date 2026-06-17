'use server';

import { redirect } from 'next/navigation';
import { clearAdminCookies, setAdminCookies } from './admin-session';

export async function loginAdmin(_prevState: { error?: string } | undefined, formData: FormData) {
  const username = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!username || !password) return { error: 'Username and password are required.' };

  if (username !== 'admin' || password !== 'admin123') {
    return { error: 'Invalid login credentials.' };
  }

  // Credentials verified — set a signed session cookie (no Supabase auth needed)
  await setAdminCookies('', '');
  redirect('/dashboard');
}

export async function logoutAdmin() {
  await clearAdminCookies();
  redirect('/login');
}

