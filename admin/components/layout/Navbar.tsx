'use client';

import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logoutAdmin } from '@/lib/admin-auth-actions';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard Overview',
  '/users': 'Users Management',
  '/partners': 'Partners Management',
  '/listings': 'Listings Management',
  '/bookings': 'Bookings Management',
};

export default function Navbar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? 'Admin Panel';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10 shadow-sm">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500 hidden sm:block">
          Welcome, <span className="font-medium text-gray-800">Admin</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm select-none cursor-pointer hover:bg-green-700 transition-colors">
          A
        </div>
        <form action={logoutAdmin}>
          <button
            title="Sign out"
            className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
