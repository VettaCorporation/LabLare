// Caminho do arquivo: /src/components/dashboard/DashboardHeader.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link'; 
import { Cog6ToothIcon, BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function DashboardHeader() {
  const { data: session } = useSession();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const userId = Number((session?.user as any)?.id_usuario || (session?.user as any)?.id) || 0; 
  
  // *** CORREÇÃO AQUI ***
  // Ajusta a rota para: /colaboradores/[ID_DO_USUÁRIO]/editar
  const profileRoute = userId ? `/dashboard/colaboradores/${userId}/editar` : '#';
  // ----------------------

  // Efeito para fechar o menu ao clicar fora dele
  useEffect(() => {
    // ... (código anterior)
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  // Função para fechar o menu após a navegação
  const handleNavigation = () => {
    setProfileMenuOpen(false);
  };
  
  const isDisabled = !session || userId === 0;

  return (
    <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Container principal */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="ml-auto flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 cursor-pointer">
            <span className="sr-only">Ver notificações</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-700" aria-hidden="true" />

          <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="-m-1.5 flex items-center p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer">
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100" aria-hidden="true">
                  Olá, {session?.user?.name || 'Usuário'}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              </span>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-900 dark:ring-1 dark:ring-white/10">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{session?.user?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>
                  <p className="text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-2 py-0.5 mt-2 inline-block dark:bg-blue-900/50 dark:text-blue-400">{(session?.user as any)?.nome_perfil}</p>
                </div>
                
                <div className="p-2">
                    <Link 
                        href={profileRoute} // <-- A ROTA CORRIGIDA ESTÁ AQUI
                        onClick={handleNavigation}
                        className={`w-full text-left block rounded-md px-3 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition ${isDisabled ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        Editar Perfil
                    </Link>
                </div>

                <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })} 
                    className="w-full text-left block rounded-md px-3 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 cursor-pointer"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}