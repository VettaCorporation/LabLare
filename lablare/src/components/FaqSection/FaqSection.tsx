// components/FaqSection/FaqSection.tsx
"use client";

import Image from 'next/image';
import DoctorFaq from '../../../public/assets/img/doctor-faq.png'; // Verifique o caminho real
import { useState } from 'react'; 

interface FaqItemProps {
  question: string;
  answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-300 rounded-lg mb-4 overflow-hidden">
      <button
        className="flex justify-between items-center w-full p-5 text-left text-gray-800 font-semibold bg-gray-50 hover:bg-gray-100 npm install --save-dev @types/xlsx"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="p-5 text-gray-600 bg-white border-t border-gray-200">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};


const FaqSection: React.FC = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center md:items-start gap-12">
        <div className="md:w-1/3 flex justify-center md:justify-start">
          <Image
            src={DoctorFaq}
            alt="Profissional de saúde para FAQ"
            width={300}
            height={300}
            layout="intrinsic"
            className="rounded-lg shadow-md"
          />
        </div>

        <div className="md:w-2/3">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center md:text-left">Dúvidas Frequentes</h2>

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