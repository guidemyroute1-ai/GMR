'use client';

import { useActionState } from 'react';
import { loginAdmin } from '@/lib/admin-auth-actions';

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, undefined);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form action={formAction} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-green-700">Guide My Route</p>
          <h1 className="text-2xl font-bold text-slate-950 mt-1">Admin sign in</h1>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="text"
            autoComplete="email"
            defaultValue="admin"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            defaultValue="admin123"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </label>

        {state?.error && (
          <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          disabled={pending}
          className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

