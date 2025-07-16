import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    // Estrutura principal com flexbox
    <div className="flex h-screen bg-gray-100">
      
      {/* 1. Barra Lateral (Sidebar) */}
      <Sidebar />

      {/* 2. Área de Conteúdo Principal */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        
        {/* Cabeçalho da área de conteúdo (com busca e perfil) */}
        <DashboardHeader />

        {/* O conteúdo da página ("EM CONSTRUÇÃO") será renderizado aqui */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 