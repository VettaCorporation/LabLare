// Caminho: src/app/dashboard/layout.tsx
import React from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <>
      <DashboardHeader />
      
      {/* Criamos a área de rolagem aqui, apenas para o conteúdo da página */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Adicione o ToastContainer aqui para que as mensagens funcionem no Dashboard */}
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
    </>
  );
};

export default DashboardLayout;
