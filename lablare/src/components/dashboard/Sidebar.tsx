'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LogoLab from '../../../public/assets/img/Logo.png';
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  CalculatorIcon,
  KeyIcon,
  TicketIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  PlusCircleIcon,
  CheckBadgeIcon, 
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType; 
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  const userProfile = (session?.user as any)?.nome_perfil;
  const userPrivileges = (session?.user as any)?.privilegios || [];

  const allNavItems: NavItem[] = [
    { name: 'Painel', href: '/dashboard', icon: HomeIcon },
    { name: 'Pacientes', href: '/dashboard/pacientes', icon: UsersIcon },
    { name: 'Orçamento', href: '/dashboard/orcamento', icon: CalculatorIcon },
    { name: 'Senha', href: '/dashboard/senha', icon: KeyIcon },
    { name: 'Etiquetas de Amostras', href: '/dashboard/etiqueta', icon: TicketIcon },
    { name: 'Recebimento de Amostras', href: '/dashboard/recebimento-amostras', icon: BeakerIcon },
    { name: 'Lançamento de Resultados', href: '/dashboard/lancamento-resultados', icon: ClipboardDocumentCheckIcon },
    { name: 'Validação de Laudos', href: '/dashboard/validacao-laudos', icon: CheckBadgeIcon },
    { name: 'Exames', href: '/dashboard/exames', icon: PlusCircleIcon },
    { name: 'Colaboradores', href: '/dashboard/colaboradores', icon: UserGroupIcon },   
    { name: 'Configurações', href: '/dashboard/configuracoes', icon: Cog6ToothIcon },
    { name: 'Privilégios', href: '/dashboard/privilegios', icon: ShieldCheckIcon },
  ];
  
  const filteredNavigation = allNavItems.filter(item => {
    if (userProfile === 'Administrador') {
      return true;
    }
    return userPrivileges.includes(item.href);
  });

  if (status === 'loading') {
    return (
      <div className="hidden lg:flex lg:flex-col lg:w-64">
        <div className="p-6 text-sm text-gray-500 dark:text-gray-400">A carregar menu...</div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:gap-y-5 lg:overflow-y-auto lg:bg-white lg:px-6 lg:pb-4 lg:border-r lg:border-gray-200 lg:w-64 lg:flex-shrink-0 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex h-16 shrink-0 items-center">
        <Image
          src={LogoLab}
          alt="Lare Laboratório Logo"
          width={100}
          height={32}
          priority
        />
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {filteredNavigation.map((item) => {
                
                let isActive = false;
                
                // MUDANÇA: Adicionada regra especial para Pacientes -> Atendimento
                if (item.href === '/dashboard/pacientes') {
                  isActive = pathname.startsWith('/dashboard/pacientes') || pathname.startsWith('/dashboard/atendimento');
                } else if (item.href === '/dashboard') {
                  isActive = pathname === item.href;
                } else {
                  isActive = pathname.startsWith(item.href);
                }

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}