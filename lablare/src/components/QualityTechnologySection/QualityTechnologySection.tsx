// components/QualityTechnologySection/QualityTechnologySection.tsx
"use client";

import Image from 'next/image';
import IconQualidadeCertificada from '../../public/assets/img/icon-qualidade-certificada.svg';
import IconConfortoMobilidade from '../../public/assets/img/icon-conforto-mobilidade.svg';
import IconPraticidade from '../../public/assets/img/icon-praticidade.svg';
import IconEquipeEspecializada from '../../public/assets/img/icon-equipe-especializada.svg';
import IconModernidadeTecnologia from '../../public/assets/img/icon-modernidade-tecnologia.svg';

const QualityTechnologySection: React.FC = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Sua saúde merece o melhor</h2>
        <p className="text-xl md:text-2xl text-gray-600 mb-12">Tecnologia e qualidade em cada exame</p>

        <p className="text-base text-gray-600 max-w-2xl mx-auto mb-16">
          No Lare Laboratório, você encontra profissionais qualificados, tecnologia de ponta e um atendimento humanizado, garantindo resultados precisos e confiáveis para sua saúde.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#E6F3EB] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <Image src="" alt="Atendimento Humanizado" width={64} height={64} />
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Atendimento Humanizado</h3>
            <p className="text-gray-600 text-sm">Laboratório que oferece atendimento Humanizado.</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#E6F3EB] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <Image src="" alt="Convênios e Acessibilidade" width={64} height={64} />
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Convênios e Acessibilidade</h3>
            <p className="text-gray-600 text-sm">Disponibilizamos o maior conforto no atendimento e coleta.</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#E6F3EB] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <Image src="" alt="Equipe Especializada" width={64} height={64} />
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Equipe Especializada</h3>
            <p className="text-gray-600 text-sm">Resultado online e envio de documentos via WhatsApp.</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#E6F3EB] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <Image src="" alt="Resultados Rápidos e Seguros" width={64} height={64} />
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Resultados Rápidos e Seguros</h3>
            <p className="text-gray-600 text-sm">Temos uma equipe qualificada e humanizada pronta para te atender.</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="bg-[#E6F3EB] rounded-full p-4 mb-4 flex items-center justify-center w-24 h-24">
              <Image src="" alt="Precisão e Tecnologia" width={64} height={64} />
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Precisão e Tecnologia</h3>
            <p className="text-gray-600 text-sm">Equipamentos modernos e alta tecnologia para sua segurança.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QualityTechnologySection;