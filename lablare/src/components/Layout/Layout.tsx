// Caminho: src/app/layout.tsx

'use client';

import './globals.css'; 
import { SessionProvider } from 'next-auth/react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Importe os componentes de layout que você usa
import Sidebar from '@/components/dashboard/Sidebar'; // Ajuste o caminho se for diferente
import Header from '@/components/Header/Header';       // O header das páginas públicas
import Footer from '@/components/Footer/Footer';       // O footer das páginas públicas

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <html lang="pt-br">
      <body>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=SUA_CHAVE_API_Maps&libraries=places`}
          async
          defer
        />
        
        <SessionProvider>
          {/* Lógica para renderizar o layout correto */}
          {isDashboard ? (
            // Se for uma página do dashboard, renderiza a estrutura com Sidebar
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>
          ) : (
            // Se for uma página pública, renderiza a estrutura com Header e Footer
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