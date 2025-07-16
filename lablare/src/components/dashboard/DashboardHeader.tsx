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
    <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Search bar */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">Buscar</label>
          <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" aria-hidden="true" />
          <input id="search-field" className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm" placeholder="Buscar..." type="search" name="search" />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">Configurações</span>
            <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">Ver notificações</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown - AGORA É UM BOTÃO */}
          <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="-m-1.5 flex items-center p-1.5 rounded-md hover:bg-gray-100 transition">
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  Olá, {session?.user?.name || 'Usuário'}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </button>

            {/* O MENU DROPDOWN */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{session?.user?.name}</p>
                    <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
                    <p className="text-xs font-medium text-blue-600 bg-blue-100 rounded-full px-2 py-0.5 mt-2 inline-block">{session?.user?.nome_perfil}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left block rounded-md px-3 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
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