// Caminho do arquivo: src/components/Header/Header.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import LogoLab from '../../../public/assets/img/Logo.png'; 

const Header: React.FC = () => {
  return (
    // MUDANÇA 1: Adicionado dark:bg-gray-900 e uma borda sutil para o modo escuro
    <header className="bg-white dark:bg-gray-900 shadow-md dark:border-b dark:border-gray-800 py-4">
      <nav className="container mx-auto flex items-center justify-between px-4">
        <Link href="/">
          <Image
            src={LogoLab}
            alt="Lare Laboratório Logo"
            width={120} 
            height={38} 
            priority
          />
        </Link>

        <ul className="hidden md:flex space-x-6">
          {/* MUDANÇA 2: Adicionado dark:text-gray-300 para todos os links */}
          <li><Link href="/home" className="text-gray-700 dark:text-gray-300 hover:text-[#3CB371] font-medium text-sm transition-colors duration-200">Início</Link></li>
          <li><Link href="/quem-somos" className="text-gray-700 dark:text-gray-300 hover:text-[#3CB371] font-medium text-sm transition-colors duration-200">Quem Somos</Link></li>
          <li><Link href="/exames" className="text-gray-700 dark:text-gray-300 hover:text-[#3CB371] font-medium text-sm transition-colors duration-200">Exames</Link></li>
          <li><Link href="/convenios" className="text-gray-700 dark:text-gray-300 hover:text-[#3CB371] font-medium text-sm transition-colors duration-200">Convênios</Link></li>
          <li><Link href="/contato" className="text-gray-700 dark:text-gray-300 hover:text-[#3CB371] font-medium text-sm transition-colors duration-200">Contato</Link></li>
        </ul>

        <Link
          href="/login"
          // Nenhuma mudança aqui, o botão já tem um bom contraste
          className="bg-[#0047AB] text-white px-5 py-2 rounded-md hover:bg-[#003A8D] transition-colors duration-200 flex items-center text-sm font-medium"
        >
          Login <span className="ml-2">→</span>
        </Link>
      </nav>
    </header>
  );
};

export default Header;