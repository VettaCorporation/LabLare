// app/layout.tsx
'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import Layout from '../components/Layout/Layout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>
        {/*
          IMPORTANTE:  'SUA_CHAVE_API_Maps'tem que colocar chave api que a gente for gerar.
        */}
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=SUA_CHAVE_API_Maps&libraries=places`}
          async
          defer
        ></script>

        <SessionProvider>
          <Layout>
            {children}
          </Layout>
        </SessionProvider>
      </body>
    </html>
  );
}