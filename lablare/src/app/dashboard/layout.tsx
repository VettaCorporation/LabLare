// Caminho: src/app/dashboard/layout.tsx
import React from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    // O DashboardHeader fica aqui, fora da área de rolagem
    <>
      <DashboardHeader />
      
      {/* Criamos a área de rolagem aqui, apenas para o conteúdo da página */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </>
  );
};

export default DashboardLayout;