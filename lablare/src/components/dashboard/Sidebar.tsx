// src/components/Sidebar/Sidebar.tsx
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
  DocumentTextIcon, // Resultados
  CalculatorIcon, // Orçamento
  KeyIcon, // Senha
  TicketIcon, // Etiqueta
  Cog6ToothIcon, // Configurações
  ShieldCheckIcon, // Privilégios (se for uma seção separada ou dentro de Configurações)
  // Adicione outros ícones que precisar
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
  const { data: session, status } = useSession() as any;

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200 w-64 flex-shrink-0 items-center justify-center">
        <p className="text-sm text-gray-500">Carregando menu...</p>
      </div>
    );
  }

  const userProfile = session?.user?.nome_perfil;
  const isAdmin = userProfile === 'Administrador'; // Variável para verificar se é Admin

  let filteredNavigation: NavItem[] = [];

  if (session) { // Apenas se houver uma sessão ativa
    // Itens que TODOS os perfis logados (exceto Admin) podem ver.
    // Administrador verá tudo que está aqui MAIS os itens exclusivos dele.
    const commonItems: NavItem[] = [
      { name: 'Painel', href: '/dashboard', icon: HomeIcon },
      { name: 'Pacientes', href: '/dashboard/pacientes', icon: UsersIcon },
      // O anexo 1 para Recepcionista não mostra Colaboradores e Resultados.
      // Então, se Colaboradores e Resultados são APENAS para Admin, coloque-os no bloco do Admin.
      // { name: 'Colaboradores', href: '/dashboard/colaboradores', icon: UserGroupIcon }, // Mover para o Admin
      // { name: 'Resultados', href: '/dashboard/resultados', icon: DocumentTextIcon }, // Mover para o Admin ou perfis específicos
      { name: 'Orçamento', href: '/dashboard/orcamento', icon: CalculatorIcon },
      { name: 'Senha', href: '/dashboard/senha', icon: KeyIcon },
      { name: 'Etiqueta', href: '/dashboard/etiqueta', icon: TicketIcon },
      { name: 'Configurações', href: '/dashboard/configuracoes', icon: Cog6ToothIcon },
    ];

    // Adicione os itens comuns
    filteredNavigation.push(...commonItems);

    // Itens específicos do Administrador (conforme Anexo 1 e sua descrição)
    if (isAdmin) {
      filteredNavigation.push(
        { name: 'Colaboradores', href: '/dashboard/colaboradores', icon: UserGroupIcon },
        { name: 'Resultados', href: '/dashboard/resultados', icon: DocumentTextIcon },
        // Se 'Privilégios' for uma tela que SÓ Administrador tem acesso total para gerenciar, coloque aqui.
        // Se Recepcionista tem uma versão simplificada de "Privilégios", o link pode ser comum e a UI interna ser condicional.
        // No anexo 1, Recepcionista tem 'Privilégios'. Então, é um item comum ou uma versão diferente?
        // Vou assumir que 'Privilégios' é para todos, mas a tela em si tem conteúdo condicional.
        // Por isso, se for item comum, ele já estaria em 'commonItems'.
        // Se o Administrador tem uma tela de privilégios diferente/mais completa:
        // { name: 'Gestão de Privilégios', href: '/dashboard/admin-privilegios', icon: ShieldCheckIcon },
        // Ou, se a tela '/dashboard/privilegios' tem UI condicional, o link já estaria em commonItems.
      );
    }
    
    // Se "Privilégios" na imagem do Recepcionista é uma tela à parte e exclusiva do Recepcionista (e talvez Admin),
    // você pode gerenciar isso de forma mais granular ou deixá-la como uma rota comum com UI condicional.
    // Pelo que entendi, você quer que todos os 4 perfis tenham "quase tudo", exceto o que é **EXCLUSIVO** do Admin.
    // Então, "Colaboradores" e "Resultados" são os candidatos a serem exclusivos do Admin no menu.
    // Vamos revisar os `commonItems` para ter certeza.

    // Ajuste fino dos commonItems:
    // Painel, Pacientes, Orçamento, Senha, Etiqueta, Configurações.
    // E, se "Privilégios" for comum a Recepcionista e Admin (Anexo 1 e 2), ele também seria comum.
    // No seu código original de Sidebar.tsx, você tinha:
    // if (userProfile === 'Recepcionista') { navItems.push({ href: '/privilegios', icon: ShieldCheckIcon, label: 'Privilégios' }); }
    // Isso sugere que Privilégios não é comum a TODOS, mas é um item para Recepcionista e Administrador.
    // Melhor gerenciar isso com um array de permissões por item no sidebar, ou duplicar.
    
    // Para simplificar, vamos definir uma lista base para Administrador e depois filtrar para outros.
    // Isso é mais claro dada a "visão completa" do Administrador.

    // Lista completa de navegação (como se fosse o Admin vendo tudo)
    const allNavItems: NavItem[] = [
      { name: 'Painel', href: '/dashboard', icon: HomeIcon },
      { name: 'Pacientes', href: '/dashboard/pacientes', icon: UsersIcon },
      { name: 'Colaboradores', href: '/dashboard/colaboradores', icon: UserGroupIcon },
      { name: 'Resultados', href: '/dashboard/resultados', icon: DocumentTextIcon },
      { name: 'Orçamento', href: '/dashboard/orcamento', icon: CalculatorIcon },
      { name: 'Senha', href: '/dashboard/senha', icon: KeyIcon },
      { name: 'Etiqueta', href: '/dashboard/etiqueta', icon: TicketIcon },
      { name: 'Configurações', href: '/dashboard/configuracoes', icon: Cog6ToothIcon },
      { name: 'Privilégios', href: '/dashboard/privilegios', icon: ShieldCheckIcon }, // Assumindo que é uma página e o link está aqui
    ];

    // Filtrar com base no perfil
    if (isAdmin) {
      filteredNavigation = allNavItems; // Admin vê tudo
    } else {
      // Outros perfis (Recepcionista, Biomédico, Técnico de Laboratório, Responsável Financeira)
      // Eles veem tudo, EXCETO o que é exclusivo do Administrador.
      // Quais são exclusivos do Administrador? Colaboradores e Resultados, talvez Gestão de Privilégios (total).

      const adminExclusiveItems = ['Colaboradores', 'Resultados']; // Nomes dos itens exclusivos do Admin

      filteredNavigation = allNavItems.filter(item => !adminExclusiveItems.includes(item.name));

      // Se "Privilégios" é visível apenas para Admin e Recepcionista (mas não para Técnico/Biomédico/Financeiro)
      // você precisaria de uma lógica mais granular ou incluí-lo nos "commonItems" se for universalmente acessível
      // por todos os 4 perfis não-Admin. Pela imagem do Recepcionista, ele vê Privilégios.
      // Então, talvez 'Privilégios' não seja exclusivo do Admin, mas sim de Admin E Recepcionista.
      // Vamos mantê-lo fora dos "exclusiveItems" por enquanto e tratar a proteção na página `/privilegios`.
    }
  }

  return (
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