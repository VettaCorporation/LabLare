// src/app/portal-paciente/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HomeIcon, UserIcon, DocumentMagnifyingGlassIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

import WelcomePopup from '@/components/WelcomePopup/WelcomePopup';

// Importar a função signOut do next-auth/react
import { signOut } from 'next-auth/react'; 

export default function PortalPacientePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user?.nome_perfil !== 'Paciente') {
      router.push('/login'); 
      return;
    }

    const isFirstLogin = true; // SIMULADOR: Substitua por lógica real (ex: session.user.primeiro_login)
    if (isFirstLogin) {
        const timer = setTimeout(() => {
            setShowWelcomePopup(true);
        }, 3000); 
        return () => clearTimeout(timer);
    }

  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-700">Carregando Portal do Paciente...</p>
      </div>
    );
  }

  if (!session || session.user?.nome_perfil !== 'Paciente') {
    return null; 
  }

  const patientName = session.user?.name || 'Paciente';
  const patientEmail = session.user?.email || 'Não informado';
  const patientCpf = session.user?.cpf || 'Não informado';

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar do Paciente */}
      <aside className="w-64 bg-white p-6 border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-center mb-8">
          <Image src="/assets/img/Logo.png" alt="Lare Logo" width={120} height={40} />
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link href="/portal-paciente" className="flex items-center p-2 text-blue-600 bg-blue-50 rounded-md font-semibold cursor-pointer">
                <HomeIcon className="h-5 w-5 mr-3" /> Painel
              </Link>
            </li>
            <li>
              <Link href="/portal-paciente/perfil" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
                <UserIcon className="h-5 w-5 mr-3" /> Perfil
              </Link>
            </li>
            <li>
              <Link href="/portal-paciente/meus-exames" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
                <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-3" /> Meus Exames
              </Link>
            </li>
            <li>
              <Link href="/portal-paciente/configuracoes" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
                <Cog6ToothIcon className="h-5 w-5 mr-3" /> Configurações
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Conteúdo Principal do Painel do Paciente */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Painel do Paciente</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Olá, {patientName}!</span>
            {/* Botão de Sair: Agora usa a função signOut diretamente */}
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })} // Redireciona para /login após o logout
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md cursor-pointer"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="bg-blue-700 text-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-2">Olá, {patientName}!</h2>
          <p className="text-lg mb-4">Acesse todo seu histórico de resultados de exames em um só lugar.</p>
          <Link href="/portal-paciente/meus-exames">
            <button className="bg-white text-blue-700 font-semibold py-2 px-6 rounded-md hover:bg-blue-100 transition-colors cursor-pointer">
              VER MEUS EXAMES
            </button>
          </Link>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Parceiros</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600">Informações sobre laboratórios parceiros, convênios, etc.</p>
          </div>
        </section>

        <section className="bg-blue-600 text-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Você tem dúvidas?</h2>
          <p className="mb-4">Entre em contato com o time de atendimento Lare Laboratórios para receber a ajuda que precisa.</p>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.135a11.042 11.042 0 005.516 5.516l1.135-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              (XX) XXXX-XXXX
            </span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 4v7a2 2 0 002 2h14a2 2 0 002-2v-7m-18 0l-2 2"></path></svg>
              larelaboratorios@gmail.com
            </span>
          </div>
        </section>
      </main>

      {showWelcomePopup && (
        <WelcomePopup 
          onClose={() => setShowWelcomePopup(false)} 
          patientName={patientName}
        />
      )}
    </div>
  );
}
