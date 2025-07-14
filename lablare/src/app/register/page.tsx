// src/app/register/page.tsx
'use client'; // Mantenha esta diretiva no topo!

import RegisterForm from '../../components/RegisterForm/RegisterForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const RegisterPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Se ainda está carregando a sessão, não faz nada
    if (status === 'loading') {
      return;
    }

    // Se o usuário está autenticado E NÃO é um administrador, redireciona
    if (status === 'authenticated' && session?.user?.nome_perfil !== 'Administrador') {
      alert('Acesso negado. Apenas administradores podem registrar novos usuários.');
      router.push('/dashboard'); // Redireciona para o dashboard
    }
    // Se o status é 'unauthenticated' (não logado), a página de registro é exibida.
    // Isso permite que um administrador (que precisa estar logado) acesse a página.
  }, [session, status, router]);

  // Se a sessão está carregando, mostra um loader
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>Carregando...</p>
      </div>
    );
  }

  // Renderiza o formulário de registro se o usuário é administrador ou se não está autenticado
  // (a lógica de redirecionamento já cuidou dos não-admins logados)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;