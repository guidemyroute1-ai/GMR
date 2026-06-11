'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === '/login' || pathname === '/delete-account';

  if (isPublicRoute) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </>
  );
}

