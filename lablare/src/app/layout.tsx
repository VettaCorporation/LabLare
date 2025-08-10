// Caminho: src/app/layout.tsx
'use client';

import './globals.css'; 
import { SessionProvider } from 'next-auth/react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  // Adicionamos uma lista de páginas que NÃO devem ter Header e Footer
  const isAuthPage = [
    '/login',
    '/esqueci-senha',
    '/enter-otp',
    '/reset-password'
  ].includes(pathname);

  return (
    <html lang="pt-br">
      <body>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=SUA_CHAVE_API_Maps&libraries=places`}
          async
          defer
        />

        <SessionProvider>
          {isDashboard ? (
            // 1. Layout do Dashboard (com Sidebar)
            <div className="flex h-screen">
              <Sidebar />
              {/* A tag <main> e a rolagem foram removidas daqui */}
              <div className="flex flex-1 flex-col">
                {children}
              </div>
            </div>
          ) : isAuthPage ? (
            // 2. Layout das Páginas de Autenticação (sem nada em volta)
            <>{children}</>
          ) : (
            // 3. Layout das Páginas Públicas (com Header e Footer)
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}