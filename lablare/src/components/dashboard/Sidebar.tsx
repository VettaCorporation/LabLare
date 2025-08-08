// Caminho: src/components/dashboard/Sidebar.tsx
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

const PlusIcon = PlusCircleIcon;

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType; 
  allowedProfiles: string[];
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userProfile = (session?.user as any)?.nome_perfil;

  const allNavItems: NavItem[] = [
    { name: 'Painel', href: '/dashboard', icon: HomeIcon, 
      allowedProfiles: ['Administrador', 'Recepcionista', 'Técnico de Laboratório', 'Biomédico', 'Responsável Financeira', 'Paciente'] },
    { name: 'Pacientes', href: '/dashboard/pacientes', icon: UsersIcon, 
      allowedProfiles: ['Administrador', 'Recepcionista', 'Técnico de Laboratório', 'Biomédico'] },
    { name: 'Orçamento', href: '/dashboard/orcamento', icon: CalculatorIcon, 
      allowedProfiles: ['Administrador', 'Recepcionista', 'Responsável Financeira'] },
    { name: 'Senha', href: '/dashboard/senha', icon: KeyIcon, 
      allowedProfiles: ['Administrador', 'Recepcionista', 'Técnico de Laboratório', 'Biomédico', 'Responsável Financeira', 'Paciente'] },
    { name: 'Etiquetas de Amostras', href: '/dashboard/etiqueta', icon: TicketIcon, 
      allowedProfiles: ['Administrador', 'Recepcionista', 'Técnico de Laboratório'] },
    { name: 'Recebimento de Amostras', href: '/dashboard/recebimento-amostras', icon: BeakerIcon, 
      allowedProfiles: ['Administrador', 'Técnico de Laboratório'] },
    { name: 'Lançamento de Resultados', href: '/dashboard/lancamento-resultados', icon: ClipboardDocumentCheckIcon, 
      allowedProfiles: ['Administrador', 'Técnico de Laboratório'] },
    { name: 'Validação de Laudos', href: '/dashboard/validacao-laudos', icon: CheckBadgeIcon, 
      allowedProfiles: ['Administrador', 'Biomédico'] },
    { name: 'Exames', href: '/dashboard/exames', icon: PlusIcon, 
      allowedProfiles: ['Administrador'] },
    { name: 'Colaboradores', href: '/dashboard/colaboradores', icon: UserGroupIcon, 
      allowedProfiles: ['Administrador'] },   
    { name: 'Configurações', href: '/dashboard/configuracoes', icon: Cog6ToothIcon, 
      allowedProfiles: ['Administrador'] },
    { name: 'Privilégios', href: '/dashboard/privilegios', icon: ShieldCheckIcon, 
      allowedProfiles: ['Administrador', 'Recepcionista'] },
  ];
  
  const filteredNavigation = allNavItems.filter(item => 
    item.allowedProfiles.includes(userProfile || '')
  );

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200 w-64 flex-shrink-0 items-center justify-center dark:bg-gray-900 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">Carregando menu...</p>
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
                // MUDANÇA 2: A nova lógica para determinar o link ativo
                const isActive = pathname === item.href || 
                                 (item.href === '/dashboard/pacientes' && pathname.startsWith('/dashboard/atendimento'));
                
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
                      <p className="hidden md:block">{item.name}</p>
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
};