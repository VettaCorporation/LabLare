// Caminho do arquivo: src/components/Header/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation"; // 1. Importado
import LogoLab from "../../../public/assets/img/Logo.png";

const Header: React.FC = () => {
  const pathname = usePathname(); // 2. Hook para obter a URL atual

  // Lista de links para facilitar a manutenção
  const navLinks = [
    { href: "/home", label: "Início" },
    { href: "/quem-somos", label: "Quem Somos" },
    { href: "/exames", label: "Exames" },
    { href: "/portal-paciente", label: "Resultados Online" },
    { href: "/contato", label: "Contato" },
  ];

  return (
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

        {/* 3. Lógica da lista de links atualizada */}
        <ul className="hidden md:flex space-x-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    hover:text-[#349860] font-medium text-sm transition-colors duration-200
                    ${
                      isActive
                        ? "text-[#63C400] font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }
                  `}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/login"
          className="bg-[#0047AB] text-white px-5 py-2 rounded-md hover:bg-[#003A8D] transition-colors duration-200 flex items-center text-sm font-medium"
        >
          Login <span className="ml-2">→</span>
        </Link>
      </nav>
    </header>
  );
};

export default Header;
