// src/app/dashboard/page.tsx
'use client'; 

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingExams, setPendingExams] = useState<number>(5);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.nome_perfil !== 'Administrador') {
      router.push('/');
    }
    // Lógica para buscar dados...
  }, [session, status, router]);

  if (status === 'loading' || !session || session.user?.nome_perfil !== 'Administrador') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-700">Carregando e verificando permissões...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">EM CONSTRUÇÃO</h1>
      <p className="text-gray-600">
        Total de Exames Pendentes: <span className="font-bold text-blue-600">{String(pendingExams).padStart(2, '0')}</span>
      </p>

      {/* Botão de Ação Principal (Opcional) */}
      <div className="mt-6">
        <Link href="/atendimento">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
            Novo Atendimento
          </button>
        </Link>
      </div>
    </div>
  );
}