import type { Metadata } from "next";
import "./globals.css";
import AdminShell from "@/components/layout/AdminShell";

export const metadata: Metadata = {
  title: "Admin Panel | Guide My Route",
  description: "Administrative dashboard for Guide My Route",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden font-sans" style={{ background: '#F8FAFC' }}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
