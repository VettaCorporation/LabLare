// Caminho do arquivo: /src/components/dashboard/DashboardHeader.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { MagnifyingGlassIcon, Cog6ToothIcon, BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function DashboardHeader() {
  const { data: session } = useSession();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Efeito para fechar o menu ao clicar fora dele
  useEffect(() => {
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

  return (
    // MUDANÇA 1: Fundo e borda do header principal
    <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Search bar */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">Buscar</label>
          {/* MUDANÇA 2: Cor do ícone de busca */}
          <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          {/* MUDANÇA 3: A correção principal para o texto do input */}
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500 sm:text-sm"
            placeholder="Buscar..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* MUDANÇA 4: Cor dos ícones de Configurações e Notificações */}
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 cursor-pointer">
            <span className="sr-only">Configurações</span>
            <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 cursor-pointer">
            <span className="sr-only">Ver notificações</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          {/* MUDANÇA 5: Cor do separador vertical */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-700" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative" ref={profileMenuRef}>
            {/* MUDANÇA 6: Cor do botão de perfil e textos */}
            <button onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="-m-1.5 flex items-center p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer">
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100" aria-hidden="true">
                  Olá, {session?.user?.name || 'Usuário'}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              </span>
            </button>

            {/* O MENU DROPDOWN */}
            {isProfileMenuOpen && (
              // MUDANÇA 7: Estilos do container do menu dropdown
              <div className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-900 dark:ring-1 dark:ring-white/10">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{session?.user?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>
                  {/* O "tag" de perfil já tem cores contrastantes, mas podemos melhorar para o modo escuro */}
                  <p className="text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-2 py-0.5 mt-2 inline-block dark:bg-blue-900/50 dark:text-blue-400">{(session?.user as any)?.nome_perfil}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
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