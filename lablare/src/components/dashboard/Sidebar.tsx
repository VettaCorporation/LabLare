'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoLab from '../../../public/assets/img/Logo.png';
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon, // 1. IMPORTAR O NOVO ÍCONE
  DocumentTextIcon,
  CalculatorIcon,
  KeyIcon,
  TicketIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Painel', href: '/dashboard', icon: HomeIcon },
  { name: 'Pacientes', href: '/dashboard/pacientes', icon: UsersIcon },
  { name: 'Colaboradores', href: '/dashboard/colaboradores', icon: UserGroupIcon },
  { name: 'Resultados', href: '/dashboard/resultados', icon: DocumentTextIcon },
  { name: 'Orçamento', href: '/dashboard/orcamento', icon: CalculatorIcon },
  { name: 'Senha', href: '/dashboard/senha', icon: KeyIcon },
  { name: 'Etiqueta', href: '/dashboard/etiqueta', icon: TicketIcon },
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Cog6ToothIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    // A ALTERAÇÃO ESTÁ NESTA LINHA: removemos 'grow' e adicionamos 'flex-shrink-0'
    <div className="flex flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200 w-64 flex-shrink-0">
      <div className="flex h-16 shrink-0 items-center">
        <Image
          src={LogoLab}
          alt="Lare Laboratório Logo"
          width={100}
        />
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
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
                    {item.name}
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