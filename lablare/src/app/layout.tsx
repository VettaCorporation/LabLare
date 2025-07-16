// src/app/layout.tsx
'use client';

import './globals.css'; 
import { SessionProvider } from 'next-auth/react'; 
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>
        {/*
          precisamos colocar a chave da api do Google Maps aqui
        */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=SUA_CHAVE_API_Maps&libraries=places`}
          async
          defer
        />
       
        <SessionProvider>
          {children} 
        </SessionProvider>
      </body>
    </html>
  );
}