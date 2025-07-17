// src/app/dashboard/page.tsx
'use client'; 

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useEffect, useState } from 'react';

import AccessDeniedPopup from '@/components/AccessDeniedPopup/AccessDeniedPopup';

// Importe seus componentes de conteúdo de dashboard para cada perfil
// import AdminDashboardContent from '@/components/Dashboard/AdminDashboardContent';
// import RecepcionistaDashboardContent from '@/components/Dashboard/RecepcionistaDashboardContent';
// import BiomedicoDashboardContent from '@/components/Dashboard/BiomedicoDashboardContent';
// import TecnicoDashboardContent from '@/components/Dashboard/TecnicoDashboardContent';
// import FinanceiroDashboardContent from '@/components/Dashboard/FinanceiroDashboardContent';


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message'); 

  const [showAccessDeniedPopup, setShowAccessDeniedPopup] = useState(false);

  useEffect(() => {
    if (message) {
      setShowAccessDeniedPopup(true);
    } else {
      setShowAccessDeniedPopup(false); 
    }

    if (status === 'loading') {
      return; 
    }
    
    if (!session) {
      router.push('/login'); 
      return; 
    }

  }, [session, status, router, searchParams, message]); 

  const handlePopupClose = () => {
    setShowAccessDeniedPopup(false);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('message');
    router.replace(`/dashboard?${newSearchParams.toString()}`);
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-700">Carregando dashboard...</p>
      </div>
    );
  }

  if (!session) {
    return null; 
  }

  const userProfileName = session.user?.nome_perfil;

  return (
    <div className="bg-white p-8 rounded-lg shadow-md min-h-screen">
      {showAccessDeniedPopup && message && (
        <AccessDeniedPopup message={message} onClose={handlePopupClose} />
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Bem-vindo(a) ao Dashboard, {session.user?.name}!
      </h1>
      <p className="text-gray-600 mb-4">
        Seu perfil: <span className="font-bold text-purple-600">{userProfileName || 'Não Definido'}</span>
      </p>
      
      {userProfileName === 'Administrador' && (
        <div className="border-t pt-4 mt-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Visão Geral do Administrador</h2>
          <p>Conteúdo específico para o perfil Administrador no Painel principal.</p>
        </div>
      )}

      {(userProfileName === 'Recepcionista' || 
        userProfileName === 'Biomédico' || 
        userProfileName === 'Técnico de Laboratório' ||
        userProfileName === 'Responsável Financeira') && ( 
        <div className="border-t pt-4 mt-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Visão Geral do {userProfileName}</h2>
          <p>Este é o conteúdo do Painel para usuários com perfil de {userProfileName}.</p>
        </div>
      )}

      {!userProfileName || (!['Administrador', 'Recepcionista', 'Biomédico', 'Técnico de Laboratório', 'Responsável Financeira'].includes(userProfileName) && (
          <div className="border-t pt-4 mt-4 text-center text-gray-500">
            <p>Seu perfil não possui uma visualização de dashboard específica neste Painel.</p>
            <p>Use o menu lateral para navegar pelas funcionalidades disponíveis.</p>
          </div>
      ))}
    </div>
  );
}