// src/components/dashboard/Sidebar.tsx
'use client';
import { useState, useEffect } from 'react';
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
    ClipboardDocumentListIcon,
    QueueListIcon,
    ChevronDownIcon,
    // --- 1. ADICIONE O ÍCONE DE "LOGS" AQUI ---
    ArchiveBoxIcon, 
} from '@heroicons/react/24/outline';

interface NavItem {
    name: string;
    href: string;
}

interface NavSection {
    name: string;
    icon: React.ElementType;
    items: NavItem[];
}

interface TopLevelNavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    type: 'single';
}

interface TopLevelNavSection {
    name: string;
    icon: React.ElementType;
    items: NavItem[];
    type: 'section';
}

type NavType = TopLevelNavItem | TopLevelNavSection;

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const userProfile = (session?.user as any)?.nome_perfil;
    const userPrivileges = (session?.user as any)?.privilegios || [];

    const navigationData: NavType[] = [
        { name: 'Painel', href: '/dashboard', icon: HomeIcon, type: 'single' },
        { name: 'Financeiro', href: '/dashboard/orcamento', icon: CalculatorIcon, type: 'single' },
        {
            name: 'Exames',
            icon: ClipboardDocumentCheckIcon,
            type: 'section',
            items: [
                { name: 'Solicitar Exame', href: '/dashboard/solicitar-exame' },
                { name: 'Aprovar Solicitações', href: '/dashboard/aprovar-solicitacoes' },
                { name: 'Pedidos', href: '/dashboard/pedidos' },
            ],
        },
        {
            name: 'Resultados',
            icon: BeakerIcon,
            type: 'section',
            items: [
                { name: 'Recebimento de Amostras', href: '/dashboard/recebimento-amostras' },
                { name: 'Lançamento de Resultados', href: '/dashboard/lancamento-resultados' },
                { name: 'Validação de Laudos', href: '/dashboard/validacao-laudos' },
            ],
        },
        {
            name: 'Pacientes',
            icon: UsersIcon,
            type: 'section',
            items: [
                { name: 'Gestão de Pacientes', href: '/dashboard/pacientes' },
                { name: 'Etiquetas de Amostras', href: '/dashboard/etiqueta' },
            ],
        },
        {
            name: 'Configurações',
            icon: Cog6ToothIcon,
            type: 'section',
            items: [
                { name: 'Gestão de Exames', href: '/dashboard/exames' },
                { name: 'Colaboradores', href: '/dashboard/colaboradores' },
                { name: 'Privilégios', href: '/dashboard/privilegios' },
                { name: 'Configurações do Sistema', href: '/dashboard/configuracoes' },
                // --- 2. ADICIONE O NOVO ITEM DE MENU AQUI ---
                { name: 'Logs de Operações', href: '/dashboard/configuracoes/logs' },
            ],
        },
    ];

    const filteredNavigation = navigationData.map(navItem => {
        if (userProfile === 'Administrador') {
            return navItem;
        }

        if (navItem.type === 'single') {
            return userPrivileges.includes(navItem.href) ? navItem : null;
        }

        if (navItem.type === 'section') {
            const filteredItems = navItem.items.filter(item => userPrivileges.includes(item.href));
            return filteredItems.length > 0 ? { ...navItem, items: filteredItems } : null;
        }
        return null;
    }).filter(Boolean) as NavType[];

    const isSectionActive = (sectionItems: NavItem[]) => {
        return sectionItems.some(item => pathname.startsWith(item.href));
    };
    
    const [openSections, setOpenSections] = useState<string[]>(() => {
        const activeSection = filteredNavigation.find(
            (navItem): navItem is TopLevelNavSection => navItem.type === 'section' && isSectionActive(navItem.items)
        );
        return activeSection ? [activeSection.name] : [];
    });

    useEffect(() => {
        const activeSection = filteredNavigation.find(
            (navItem): navItem is TopLevelNavSection => navItem.type === 'section' && isSectionActive(navItem.items)
        );
        if (activeSection && !openSections.includes(activeSection.name)) {
            setOpenSections(prev => [...prev, activeSection.name]);
        }
    }, [pathname, filteredNavigation, openSections]);

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
                            {filteredNavigation.map((navItem) => {
                                if (navItem.type === 'single') {
                                    const isActive = navItem.href === '/dashboard'
                                        ? pathname === navItem.href
                                        : pathname.startsWith(navItem.href);
                                    const Icon = navItem.icon;

                                    return (
                                        <li key={navItem.name}>
                                            <Link
                                                href={navItem.href}
                                                className={classNames(
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )}
                                            >
                                                <Icon
                                                    className={classNames(
                                                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400',
                                                        'h-6 w-6 shrink-0'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {navItem.name}
                                            </Link>
                                        </li>
                                    );
                                } else {
                                    const isSectionCurrentlyActive = isSectionActive(navItem.items);
                                    const ChevronIcon = ChevronDownIcon;
                                    const SectionIcon = navItem.icon;

                                    return (
                                        <li key={navItem.name}>
                                            <button
                                                onClick={() => handleToggle(navItem.name)}
                                                className={classNames(
                                                    isSectionCurrentlyActive ? 'bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400',
                                                    'group flex items-center justify-between w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )}
                                            >
                                                <div className="flex items-center gap-x-3">
                                                    <SectionIcon className={classNames(isSectionCurrentlyActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400', 'h-6 w-6 shrink-0')} aria-hidden="true" />
                                                    {navItem.name}
                                                </div>
                                                <ChevronIcon className={classNames(openSections.includes(navItem.name) ? 'rotate-180' : '', 'h-5 w-5 shrink-0 transition-transform duration-200')} />
                                            </button>
                                            {openSections.includes(navItem.name) && (
                                                <ul className="mt-1 pl-4 pr-2 space-y-1">
                                                    {navItem.items.map((item) => {
                                                        const isSubItemActive = pathname.startsWith(item.href);
                                                        return (
                                                            <li key={item.name} className="relative">
                                                                <Link
                                                                    href={item.href}
                                                                    className={classNames(
                                                                        isSubItemActive
                                                                            ? 'bg-gray-100 text-blue-600 dark:bg-gray-800'
                                                                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800',
                                                                        'group flex items-center gap-x-3 rounded-md py-2 pl-4 pr-2 text-sm leading-6'
                                                                    )}
                                                                >
                                                                    <div className="w-6 flex justify-center">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500" />
                                                                    </div>
                                                                    <span className={classNames(isSubItemActive ? 'font-semibold' : 'font-normal')}>
                                                                        {item.name}
                                                                    </span>
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                }
                            })}
                        </ul>
                    </li>
                </ul>
            </nav>
        </div>
    );
}