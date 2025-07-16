// src/app/dashboard/page.tsx
'use client'; 

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // Estado para dados futuros, como o total de exames pendentes
  const [pendingExams, setPendingExams] = useState<number>(5); // Valor de exemplo

  useEffect(() => {
    if (status === 'loading') return;

    // Redireciona se não estiver logado
    if (!session) {
      router.push('/'); 
      return;
    }

    // Redireciona se não for administrador
    if (session.user?.nome_perfil !== 'Administrador') {
      alert('Acesso negado. Esta área é restrita para administradores.');
      router.push('/home'); // Redireciona para a home pública
    }

    // Aqui você poderia fazer uma chamada a uma API para buscar dados reais
    // fetch('/api/dashboard/stats').then(res => res.json()).then(data => setPendingExams(data.pendingExams));

  }, [session, status, router]);

  // Loader enquanto a sessão está carregando
  if (status === 'loading' || !session || session.user?.nome_perfil !== 'Administrador') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-700">Carregando e verificando permissões...</p>
      </div>
    );
  }

  // A UI principal do dashboard
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">EM CONSTRUÇÃO</h1>
      <p className="text-gray-600">
        Total de Exames Pendentes: <span className="font-bold text-blue-600">{String(pendingExams).padStart(2, '0')}</span>
      </p>

       {/* Botões para ações rápidas - podem ser adicionados aqui */}
       <div className="mt-6 flex gap-4">
          <Link href="/atendimento">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
              Novo Atendimento
            </button>
          </Link>
          <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
              Sair
          </button>
       </div>
    </div>
  );
}