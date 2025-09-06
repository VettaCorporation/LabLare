'use client';

import { useState } from 'react';
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
  TicketIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  PlusCircleIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon, // Importado para o novo item
  QueueListIcon, 
  ChevronDownIcon,
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
    { name: 'Financeiro', href: '/dashboard/orcamento', icon: CalculatorIcon },
  ];

  const navSections = [
    {
      name: 'Exames',
      icon: ClipboardDocumentCheckIcon,
      items: [
        { name: 'Solicitar Exame', href: '/dashboard/solicitar-exame', icon: ClipboardDocumentCheckIcon },
        { name: 'Aprovar Solicitações', href: '/dashboard/aprovar-solicitacoes', icon: ClipboardDocumentListIcon },
        { name: 'Pedidos', href: '/dashboard/pedidos', icon: QueueListIcon },
      ]
    },
    {
      name: 'Resultados',
      icon: BeakerIcon,
      items: [
        { name: 'Recebimento de Amostras', href: '/dashboard/recebimento-amostras', icon: BeakerIcon },
        { name: 'Lançamento de Resultados', href: '/dashboard/lancamento-resultados', icon: PlusCircleIcon },
        { name: 'Validação de Laudos', href: '/dashboard/validacao-laudos', icon: CheckBadgeIcon },
      ]
    },
    {
      name: 'Pacientes',
      icon: UsersIcon,
      items: [
        { name: 'Gestão de Pacientes', href: '/dashboard/pacientes', icon: UsersIcon },
        { name: 'Etiquetas de Amostras', href: '/dashboard/etiqueta', icon: TicketIcon },
      ]
    },
    {
      name: 'Configurações',
      icon: Cog6ToothIcon,
      items: [
        { name: 'Gestão de Exames', href: '/dashboard/exames', icon: BeakerIcon },
        { name: 'Colaboradores', href: '/dashboard/colaboradores', icon: UserGroupIcon },
        { name: 'Privilégios', href: '/dashboard/privilegios', icon: ShieldCheckIcon },
        { name: 'Configurações do Sistema', href: '/dashboard/configuracoes', icon: Cog6ToothIcon },
      ]
    }
  ];

  const filteredNavigation = allNavItems.filter(item => {
    if (userProfile === 'Administrador') {
      return true;
    }
    return userPrivileges.includes(item.href);
  });

  const isSectionActive = (sectionItems: NavItem[]) => {
    return sectionItems.some(item => pathname.startsWith(item.href));
  };

  const [openSections, setOpenSections] = useState<string[]>(() => {
    const activeSection = navSections.find(section => isSectionActive(section.items));
    return activeSection ? [activeSection.name] : [];
  });

  // Set the initial open section based on the current path
  useState(() => {
    const activeSection = navSections.find(section => isSectionActive(section.items));
    if (activeSection) {
      if (!openSections.includes(activeSection.name)) {
        setOpenSections(prev => [...prev, activeSection.name]);
      }
    }
  });

  const handleToggle = (sectionName: string) => {
    setOpenSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

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
                 const isActive = item.href === '/dashboard'
                   ? pathname === item.href
                   : pathname.startsWith(item.href);
 
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
 
               {navSections.map((section) => {
                 const filteredItems = section.items.filter(item => userProfile === 'Administrador' || userPrivileges.includes(item.href));
                 if (filteredItems.length === 0) return null;
 
                 const isSectionCurrentlyActive = isSectionActive(filteredItems);
 
                 return (
                   <li key={section.name}>
                     <button
                       onClick={() => handleToggle(section.name)}
                       className={classNames(
                         isSectionCurrentlyActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400',
                         'group flex items-center justify-between w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                       )}
                     >
                       <div className="flex items-center gap-x-3">
                         <section.icon className={classNames(isSectionCurrentlyActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400', 'h-6 w-6 shrink-0')} aria-hidden="true" />
                         {section.name}
                       </div>
                       <ChevronDownIcon className={classNames(openSections.includes(section.name) ? 'rotate-180' : '', 'h-5 w-5 shrink-0 transition-transform duration-200')} />
                     </button>
                     {openSections.includes(section.name) && (
                       <ul className="mt-1 pl-4 pr-2 space-y-1">
                         {filteredItems.map((item) => (
                           <li key={item.name} className="relative">
                             <Link
                               href={item.href}
                               className={classNames(
                                 pathname.startsWith(item.href)
                                   ? 'bg-gray-100 text-blue-600 dark:bg-gray-800'
                                   : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800',
                                 'group flex items-center gap-x-3 rounded-md py-2 pl-4 pr-2 text-sm leading-6'
                               )}
                             >
                               <div className="w-6 flex justify-center">
                                 <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500" />
                               </div>
                               <span className={classNames(pathname.startsWith(item.href) ? 'font-semibold' : 'font-normal')}>
                                 {item.name}
                               </span>
                             </Link>
                           </li>
                         ))}
                       </ul>
                     )}
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