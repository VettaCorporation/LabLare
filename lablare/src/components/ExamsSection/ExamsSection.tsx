// components/ExamsSection/ExamsSection.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import LogoHapvida from '../../../public/assets/img/logo-convenio-hapvida.png';
import LogoSantander from '../../../public/assets/img/logo-convenio-santander.png';


const ExamsSection: React.FC = () => {
  return (
    <section className="bg-gray-100 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">QUAL EXAME VOCÊ PROCURA?</h2>
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Digite o nome do exame que você deseja"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3CB371] text-gray-700"
          />
          
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-6">EXAMES MAIS BUSCADOS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#0047AB] flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">HEMOGRAMA</h4>
              <p className="text-gray-600 text-sm mb-4">Detecta problemas de saúde como anemia, infecções e inflamações.</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-600">R$ 50,00</span>
              <Link href="#" className="block text-sm text-[#0047AB] hover:underline mt-1">Ver mais</Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#0047AB] flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">GLICEMIA</h4>
              <p className="text-gray-600 text-sm mb-4">Verifica os níveis de açúcar no sangue, fundamental para diabetes.</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-600">R$ 50,00</span>
              <Link href="#" className="block text-sm text-[#0047AB] hover:underline mt-1">Ver mais</Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#0047AB] flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">COLESTEROL</h4>
              <p className="text-gray-600 text-sm mb-4">Avalia os níveis de colesterol bom e ruim no organismo.</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-600">R$ 50,00</span>
              <Link href="#" className="block text-sm text-[#0047AB] hover:underline mt-1">Ver mais</Link>
            </div>
          </div>
          {/* Exame 4 */}
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#0047AB] flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">URINÁLISE</h4>
              <p className="text-gray-600 text-sm mb-4">Detecta infecções urinárias e outras condições renais.</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-600">R$ 50,00</span>
              <Link href="#" className="block text-sm text-[#0047AB] hover:underline mt-1">Ver mais</Link>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-4 mt-8">
          <Link
            href="/ver-todos-exames"
            className="inline-block border border-gray-400 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
          >
            Ver todos os exames
          </Link>
          <div className="flex space-x-4">
            <Image src={LogoHapvida} alt="Logo Unimed" width={80} height={30} objectFit="contain" />
            <Image src={LogoSantander} alt="Logo Amil" width={80} height={30} objectFit="contain" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExamsSection;