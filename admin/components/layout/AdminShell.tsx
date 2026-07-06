'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

// Routes that should render without the admin sidebar/navbar
const BARE_ROUTES = ['/delete-account'];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.some(route => pathname.startsWith(route))) {
    return <>{children}</>;
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
