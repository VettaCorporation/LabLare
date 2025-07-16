
'use client'; 

import RegisterForm from '../../components/RegisterForm/RegisterForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const RegisterPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
  
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      alert('Você precisa estar logado para acessar esta página.'); 
      router.push('/'); 
      return; 
    }

   
    if (status === 'authenticated' && session?.user?.nome_perfil !== 'Administrador') {
      alert('Acesso negado. Apenas administradores podem registrar novos usuários.');
      router.push('/dashboard'); 
      return;
    }

    
  }, [session, status, router]);


  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Verificando permissões...</p>
      </div>
    );
  }


  if (status === 'authenticated' && session?.user?.nome_perfil === 'Administrador') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <RegisterForm />
      </div>
    );
  }


  return null; 
};

export default RegisterPage;