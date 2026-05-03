// src/app/layout.tsx
"use client";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = [
    "/login",
    "/esqueci-senha",
    "/enter-otp",
    "/reset-password",
  ].includes(pathname);

  return (
    <html lang="pt-br" className="h-full">
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          {isDashboard ? (
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex flex-1 flex-col">{children}</div>
            </div>
          ) : isAuthPage ? (
            <main className="flex-1">{children}</main>
          ) : (
            <>
              <Header />
              {/* evita que decorações absolutas do último bloco “vazem” sobre o footer */}
              <main className="flex-1 relative z-0 overflow-hidden">
                {children}
              </main>
              <Footer />
            </>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
