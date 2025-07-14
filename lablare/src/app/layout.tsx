
'use client';

import './globals.css'; 
import { SessionProvider } from 'next-auth/react'; 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>
        <div>
          <SessionProvider>
            {children}
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}