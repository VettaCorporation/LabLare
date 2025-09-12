// components/FaqSection/FaqSection.tsx
"use client";

import Image from "next/image";
import IconDoctorFaq from "../../../public/assets/img/icon-doctor-faq.png";
import IconElipse from "../../../public/assets/img/icon-elipse.png";
import IconSetaBaixo from "../../../public/assets/img/icon-seta-baixo.svg";
import { useState, useRef, useEffect } from "react";

interface FaqItemProps {
  question: string;
  answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState("0px");

  useEffect(() => {
    if (contentRef.current) {
      setMaxH(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
    }
  }, [isOpen]);

  return (
    <div
      className={[
        "relative w-full mb-4 bg-white rounded-2xl overflow-hidden transition-all duration-300",
        "shadow-[0px_0.38px_0px_0px_rgba(99,196,0,1)] border-l-[2.83px] border-l-[#100E3D]",
        // linha verde inferior:
        "after:content-[''] after:absolute after:bottom-0 after:h-px after:bg-[#63C400]",
        "after:left-0 after:right-0",
      ].join(" ")}
    >
      {/*
      {/* Cabeçalho */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="h-20 w-full px-5 py-5 inline-flex justify-between items-center gap-5 relative z-10"
      >
        <span
          className={`text-stone-800 font-sans font-bold transition-all ${
            isOpen ? "text-2xl" : "text-xl"
          }`}
        >
          {question}
        </span>

        {/* SVG componente (SVGR) com tamanho fixo, cor forçada e rotação ao abrir */}
        <IconSetaBaixo
          className={`w-6 h-6 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          } text-black`}
          aria-hidden="true"
          focusable="false"
          // garantem visibilidade mesmo se o arquivo vier com fill/ stroke "none"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1}
        />
      </button>

      {/* Conteúdo colapsável */}
      <div
        ref={contentRef}
        style={{ maxHeight: maxH }}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      >
        <div className="px-5 pb-5">
          <p className="text-black text-base font-normal font-sans leading-snug">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};


const FaqSection: React.FC = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center md:items-start gap-12">
        <div className="md:w-1/3 flex justify-center md:justify-start relative">
          <Image
            src={IconElipse}
            alt="Elipse decorativa"
            width={150}
            height={150}
            className="absolute w-64 h-6 ml-[5.75rem] mt-60"
            priority
          />
          <Image
            src={IconDoctorFaq}
            alt="Profissional de saúde para FAQ"
            width={300}
            height={300}
            className="rounded-lg ml-[3.75rem] -mt-11"
            priority
          />
        </div>

        <div className="md:w-2/3 w-full">
          <h2 className="text-5xl font-bold text-gray-800 mb-8 -mt-20 text-center md:text-left font-sans">
            Dúvidas Frequentes
          </h2>

          <FaqItem
            question="Resultados Online"
            answer="Você pode acessar seus resultados de exames de forma prática e segura através da nossa plataforma online, utilizando seu login e senha."
          />
          <FaqItem
            question="Convênios aceitos"
            answer="Aceitamos uma ampla rede de convênios. Para consultar a lista completa, visite nossa página de Convênios ou entre em contato conosco."
          />
          <FaqItem
            question="Horário de Funcionamento"
            answer="Nosso horário de funcionamento é de Segunda a Sexta, das 7h às 18h, e Sábados, das 8h às 12h. Consulte feriados."
          />
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
