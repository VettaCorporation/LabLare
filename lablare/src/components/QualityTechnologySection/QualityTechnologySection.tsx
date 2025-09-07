// components/QualityTechnologySection/QualityTechnologySection.tsx
"use client";

import Image from 'next/image';
import IconCoracao from "../../../public/assets/img/icon-coracao.svg";
import IconHospital from '../../../public/assets/img/icon-hospital.svg';
import IconDoctor from '../../../public/assets/img/icon-doctor.svg';
import IconDocumento from '../../../public/assets/img/icon-documento.svg';
import IconMicroscopio from '../../../public/assets/img/icon-microscopio.svg';

const QualityTechnologySection: React.FC = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
          Sua saúde merece o melhor:
        </h2>
        <p className="text-5xl md:text-6xl font-bold text-gray-800 mb-12">
          Tecnologia e qualidade em cada exame
        </p>

        <p className="text-xl font-light text-gray-500 max-w-2xl mx-auto mb-16 font-sans">
          No <span className="font-bold text-lime-500">Lare Laboratório</span>,
          você encontra profissionais qualificados, tecnologia de ponta e um
          atendimento humanizado, garantindo resultados precisos e confiáveis
          para sua saúde.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#003580] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <IconCoracao
                className="w-12 h-12"
                aria-label="Atendimento Humanizado"
              />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2 font-sans">
              Atendimento Humanizado
            </h3>
            <p className="text-gray-600 text-sm font-sans font-light mt-2">
              Atendimento acolhedor e personalizado, com foco no bem estar de
              cada paciente.
            </p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#003580] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <IconHospital
                className="w-12 h-12"
                aria-label="Atendimento Humanizado"
              />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2 font-sans">
              Convênios <br /> e Acessibilidade
            </h3>
            <p className="text-gray-600 text-sm font-sans font-light mt-2">
              Conforto e praticidade no atendimento, com ampla rede de convênios
              e fácil acessibilidade.
            </p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#003580] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <IconDoctor
                className="w-12 h-12"
                aria-label="Equipe Especializada"
              />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2 font-sans">
              Equipe <br /> Especializada
            </h3>
            <p className="text-gray-600 text-sm font-sans font-light mt-2">
              Profissionais qualificados e agilidade no envio de resultados
              diretamente pelo WhatsApp.
            </p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#003580] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <IconDocumento
                className="w-12 h-12"
                aria-label="Resultados Rápidos e Seguros"
              />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2 font-sans">
              Resultados <br /> Rápidos e Seguros
            </h3>
            <p className="text-gray-600 text-sm font-sans font-light mt-2">
              Resultados rápidos, precisos e com segurança, entregues por uma
              equipe altamente capacitada.
            </p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#003580] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <IconMicroscopio
                className="w-14 h-12"
                aria-label="Precisão e Tecnologia"
              />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2 font-sans">
              Precisão <br /> e Tecnologia
            </h3>
            <p className="text-gray-600 text-sm font-sans font-light mt-2">
              Tecnologia de ponta e equipamentos modernos para garantir
              diagnósticos precisos e seguros.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QualityTechnologySection;