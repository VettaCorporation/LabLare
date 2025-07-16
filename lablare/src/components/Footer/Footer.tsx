// src/components/Footer/Footer.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import LogoLab from '../../../public/assets/img/Logo.png'; // Verifique o caminho real do seu logo
import MapComponent from '../MapComponent/MapComponent'; // Importe o componente do mapa

const Footer: React.FC = () => {
  return (
    <>
      {/* Rodapé Principal */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Coluna 1: Logo e Descrição */}
          <div className="col-span-1">
            <Link href="/">
              <Image
                src={LogoLab}
                alt="Lare Laboratório Logo"
                width={100}
                height={32}
                className="mb-4"
              />
            </Link>
            <p className="text-sm">
              Lare Laboratório: Sua saúde é nossa missão. Oferecemos exames precisos e atendimento humanizado.
            </p>
          </div>

          {/* Coluna 2: Informações de Contato */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4 text-lg">Informações</h3>
            <ul className="space-y-2 text-sm">
              <li>Endereço: Rua Exemplo, 123 - Cidade, UF</li>
              <li>Telefone: (XX) XXXX-XXXX</li>
              <li>Email: contato@larelaboratorio.com.br</li>
              <li>Horário: Seg-Sex: 7h-18h, Sáb: 8h-12h</li>
            </ul>
          </div>

          {/* Coluna 3: Links Úteis */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4 text-lg">Links Úteis</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/quem-somos" className="hover:underline">Quem Somos</Link></li>
              <li><Link href="/exames" className="hover:underline">Exames</Link></li>
              <li><Link href="/convenios" className="hover:underline">Convênios</Link></li>
              <li><Link href="/contato" className="hover:underline">Contato</Link></li>
              <li><Link href="/politica-privacidade" className="hover:underline">Política de Privacidade</Link></li>
            </ul>
          </div>

          {/* Coluna 4: Mapa de Localização (mini - AGORA INTERATIVO) */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4 text-lg">Nossa Localização</h3>
            {/* Substitua latitude e longitude pelas coordenadas exatas da sua localização */}
            <MapComponent latitude={-23.550520} longitude={-46.633308} zoom={16} />
          </div>
        </div>

        {/* Direitos Autorais na parte inferior */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Lare Laboratório. Todos os direitos reservados.</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;