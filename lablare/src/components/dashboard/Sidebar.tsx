// src/components/dashboard/Sidebar.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LogoLab from '../../../public/assets/img/Logo.png';
import {
  HomeIcon,
  UsersIcon, // Pacientes
  UserGroupIcon, // Colaboradores
  CalculatorIcon, // Orçamento
  KeyIcon, // Senha
  TicketIcon, // Etiqueta
  Cog6ToothIcon, // Configurações
  ShieldCheckIcon, // Privilégios
  BeakerIcon, // Ícone para Recebimento de Amostras
  ClipboardDocumentCheckIcon, // NOVO: Ícone para Lançamento de Resultados
} from '@heroicons/react/24/outline'; 

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

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200 w-64 flex-shrink-0 items-center justify-center">
        <p className="text-sm text-gray-500">Carregando menu...</p>
      </div>
    );
  }

  const userProfile = session?.user?.nome_perfil;
  const isAdmin = userProfile === 'Administrador';
  const isRecepcionista = userProfile === 'Recepcionista';
  const isTecnicoLaboratorio = userProfile === 'Técnico de Laboratório';
  const isBiomedico = userProfile === 'Biomédico';
  const isResponsavelFinanceira = userProfile === 'Responsável Financeira';
  const isPaciente = userProfile === 'Paciente';


  // Lista completa de navegação com permissões definidas para cada item
  const allNavItems: NavItem[] = [
    { name: 'Painel', href: '/dashboard', icon: HomeIcon, 
      allowedProfiles: ['Administrador', 'Recepcionista', 'Técnico de Laboratório', 'Biomédico', 'Responsável Financeira', 'Paciente'] },
    { name: 'Pacientes', href: '/dashboard/pacientes', icon: UsersIcon, 
      allowedProfiles: ['Administrador', 'Recepcionista', 'Técnico de Laboratório', 'Biomédico'] },
    { name: 'Colaboradores', href: '/dashboard/colaboradores', icon: UserGroupIcon, 
      allowedProfiles: ['Administrador'] },
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
    { name: 'Configurações', href: '/dashboard/configuracoes', icon: Cog6ToothIcon, 
      allowedProfiles: ['Administrador'] },
    { name: 'Privilégios', href: '/dashboard/privilegios', icon: ShieldCheckIcon, 
      allowedProfiles: ['Administrador', 'Recepcionista'] },
  ];

  // Filtra a navegação com base no perfil do usuário logado
  const filteredNavigation = allNavItems.filter(item => 
    item.allowedProfiles.includes(userProfile || '')
  );

  return (
    <div className="flex flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200 w-64 flex-shrink-0">
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
              {filteredNavigation.map((item) => ( 
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={classNames(
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                        'h-6 w-6 shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    <p className="hidden md:block">{item.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
