// src/app/dashboard/page.tsx
'use client'; // Necessário para usar hooks do React e do NextAuth.js

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link'; // Importar Link para o botão "Adicionar Funcionário"

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Se a sessão ainda está carregando, não faz nada
    if (status === 'loading') {
      return;
    }

    // Se o usuário não está autenticado, redireciona para a página de login
    if (status === 'unauthenticated') {
      router.push('/'); // Redireciona para a página de login (sua raiz)
    }
    // Se o usuário está autenticado, mas não é administrador e tenta acessar
    // uma área restrita (como /register, que será protegida), ele já será redirecionado
    // pela lógica na própria página de registro.
    // Aqui, na dashboard, apenas exibimos o conteúdo ou a mensagem de não permissão.
  }, [status, router]);

  // Exibe um loader enquanto a sessão está sendo carregada
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Carregando informações do usuário...</p>
      </div>
    );
  }

  // Se o usuário não está autenticado (status 'unauthenticated'), o useEffect já o redirecionou.
  // Se chegamos aqui, o status é 'authenticated'.
  if (status === 'authenticated') {
    const isAdmin = session?.user?.nome_perfil === 'Administrador';

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bem-vindo(a), {session?.user?.name || session?.user?.email}!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Você está logado(a) como: <span className="font-semibold">{session?.user?.nome_perfil || 'Usuário'}</span>
        </p>

        {/* Botão para adicionar funcionário (apenas para administradores) */}
        {isAdmin && (
          <Link href="/register">
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-200 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Adicionar Funcionário
            </button>
          </Link>
        )}

        {/* Botão de Sair */}
        <button
          onClick={() => signOut({ callbackUrl: '/' })} // Redireciona para a página inicial (login) após o logout
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
        >
          Sair
        </button>
      </main>
    );
  }

  // Se o usuário está autenticado mas NÃO é administrador, exibe mensagem de permissão negada.
  // Isso é um fallback, pois a página de registro já redireciona quem não é admin.
  // Mas, para a dashboard, se um não-admin logar, ele verá isso.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h2>
        <p className="text-lg text-gray-700 mb-6">Você não tem permissão para acessar esta página.</p>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
        >
          Sair
        </button>
      </div>
    </div>
  );
}