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

    // PRIMEIRA VERIFICAÇÃO: Se o usuário NÃO ESTÁ AUTENTICADO, redireciona para o login
    if (status === 'unauthenticated') {
      alert('Você precisa estar logado para acessar esta página.'); // Mensagem mais genérica
      router.push('/'); // Redireciona para a página de login (sua raiz)
      return; // Interrompe a execução do useEffect
    }

    // SEGUNDA VERIFICAÇÃO: Se o usuário está autenticado E NÃO é um administrador, redireciona
    if (status === 'authenticated' && session?.user?.nome_perfil !== 'Administrador') {
      alert('Acesso negado. Apenas administradores podem registrar novos usuários.');
      router.push('/dashboard'); // Redireciona para o dashboard
      return; // Interrompe a execução do useEffect
    }

    // Se chegamos aqui, significa que o status é 'authenticated' E o nome_perfil É 'Administrador'.
    // Então, o usuário está autorizado a ver a página.
  }, [session, status, router]);

  // Renderiza um loader enquanto a sessão está sendo verificada
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Verificando permissões...</p>
      </div>
    );
  }

  // Renderiza o formulário SOMENTE se o usuário estiver autenticado E for um Administrador.
  // Se não for, o useEffect já terá redirecionado.
  if (status === 'authenticated' && session?.user?.nome_perfil === 'Administrador') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <RegisterForm />
      </div>
    );
  }

  // Caso contrário (por exemplo, se o useEffect já redirecionou mas o componente ainda não desmontou),
  // não renderiza nada ou uma mensagem de espera.
  return null; // Ou uma mensagem como "Aguarde o redirecionamento..."
};

export default RegisterPage;