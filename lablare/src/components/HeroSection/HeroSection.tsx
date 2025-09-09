// components/HeroSection/HeroSection.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import IconLaboratorio from "../../../public/assets/img/icon-laboratorio-banner.png";

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-[#0047AB] text-white pt-20 pb-0 md:pt-24 md:pb-0 overflow-hidden h-[600px]">
      {/* Elipse de fundo */}
      <div
        className="absolute w-[695.68px] h-[695.68px] rounded-full border-[79.18px] border-cyan-200/30"
        style={{
          top: "80%",
          right: "11.5%",
          transform: "translateY(-50%)",
          zIndex: 0,
        }}
      ></div>

      {/* Imagem posicionada ABSOLUTAMENTE */}
      <div className="absolute z-10 right-[165px] top-[45px]">
        <Image
          src={IconLaboratorio}
          alt="Ícone do Laboratório"
          className="w-[900px] h-auto"
          priority
        />
      </div>

      {/* Texto */}
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4 relative z-10">
        <div className="md:w-1/2 text-center md:text-left mt-16 pb-16">
          <div className="mb-2 w-auto inline-block text-lime-300 text-2xl font-medium whitespace-nowrap">
            LARE LABORATÓRIO
          </div>
          <h1 className="text-4xl md:text-7xl font-bold leading-tight mb-5 drop-shadow-lg font-jost">
            SUA SAÚDE
            <br />
            <span className="text-lime-300">NOSSA</span> MISSÃO
          </h1>
          <Link
            href="/login"
            className="inline-block bg-[#63C400] hover:bg-[#349860] text-white font-semibold py-3 px-7 rounded-full transition-colors duration-300 shadow-lg transform hover:scale-105 text-lg"
          >
            Resultados de Exames
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
