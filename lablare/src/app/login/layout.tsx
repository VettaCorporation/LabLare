// src/app/login/layout.tsx
'use client'; // Necessário pois este layout é um Client Component

import React from 'react';
// Não importe Header ou Footer aqui, pois você não os quer na tela de login.

interface LoginLayoutProps {
  children: React.ReactNode;
}

const LoginLayout: React.FC<LoginLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {children} {/* app/login/page.tsx será renderizado aqui */}
      </main>
    </div>
  );
};

export default LoginLayout;