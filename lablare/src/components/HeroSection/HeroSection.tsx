// components/HeroSection/HeroSection.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import DoctorLab from '../../../public/assets/img/Doctor.png'; 

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-[#0047AB] text-white pt-20 pb-0 md:pt-24 md:pb-0 overflow-hidden">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4 relative z-10">
        <div className="md:w-1/2 text-center md:text-left mb-0 md:mb-0 pb-16 md:pb-0">
          <p className="text-base font-semibold mb-2 opacity-90">LARE LABORATÓRIO</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-8 drop-shadow-lg">
            SUA SAÚDE<br />NOSSA MISSÃO
          </h1>
          <Link
            href="/resultados-exames"
            className="inline-block bg-[#3CB371] hover:bg-[#349860] text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 shadow-lg transform hover:scale-105 text-lg"
          >
            Resultados de Exames
          </Link>
        </div>
        <div className="md:w-1/2 flex justify-center md:justify-end mt-8 md:mt-0">
          <Image
            src={DoctorLab}
            alt="Profissional de saúde segurando amostra de sangue"
            width={600}
            height={600}
            layout="intrinsic"
            className="rounded-t-lg md:rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;