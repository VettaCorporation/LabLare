"use client";

import Image from "next/image";
import FotoLaboratorio from "../../../public/assets/img/foto-laboratorio.png";
import IconCoracao from "../../../public/assets/img/icon-coracao.svg";
import IconHospital from "../../../public/assets/img/icon-hospital.svg";
import IconDoctor from "../../../public/assets/img/icon-doctor.svg";
import IconDocumento from "../../../public/assets/img/icon-documento.svg";
import IconMicroscopio from "../../../public/assets/img/icon-microscopio.svg";
import { CheckCircle2, Shield, Clock, Smartphone } from "lucide-react";

const PHOTO_PX = 460; // diâmetro da foto (px), ajuste livre

const AboutUsSection: React.FC = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-10 flex flex-col md:flex-row items-center justify-center gap-[111px]">
        {/* ESQUERDA: Foto circular */}
        <div className="relative shrink-0 pr-[14px] md:pr-[22px]">
          <div
            className="relative inline-block"
            style={{ width: PHOTO_PX, height: PHOTO_PX }}
          >
            <Image
              src={FotoLaboratorio}
              alt="Equipe do Lare Laboratório"
              fill
              sizes={`${PHOTO_PX}px`}
              priority
              className="rounded-full object-cover shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
            />

            {/* Selo “+10 anos de experiência”*/}
            <div
              className="absolute top-[88%] -translate-y-1/2 right-[-14px] md:right-[-22px]
                bg-lime-500 text-white rounded-xl px-7 py-3 shadow
                inline-flex flex-col items-center justify-center text-center leading-tight"
            >
              <span className="text-3xl font-semibold font-montserrat tracking-wide">
                +10 ANOS
              </span>
              <span className="text-sm font-normal font-sans tracking-wide mt-0.5">
                de experiência
              </span>
            </div>
          </div>
        </div>

        {/* DIREITA: Título + texto + tópicos */}
        <div className="self-center">
          <p className="text-[#003580] font-jost tracking-widest text-xl font-semibold uppercase mb-2 mt-4">
            AFINAL, QUEM SOMOS?
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-lime-600 mb-5 font-sans">
            Lare
            Laboratório
          </h2>

          <p className="text-neutral-700 text-lg leading-relaxed mb-6 font-sans">
            Somos o <strong>Lare Laboratório</strong>, aqui unimos tecnologia de ponta,
            equipe qualificada e um atendimento realmente humano para você se
            sentir seguro do começo ao fim. Cada etapa, do agendamento ao
            resultado, é pensada para ser simples, rápida e precisa, com
            processos padronizados e conferência rigorosa dos exames. Nosso
            compromisso é cuidar de você com eficiência e respeito, para que a
            sua experiência seja leve e seus resultados, confiáveis.
          </p>

          <ul className="space-y-3 mb-8 text-neutral-700">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-lime-600 mt-1" />
              <span>
                <strong>Resultados ágeis e seguros</strong> com validação
                técnica e acesso online, prático de visualizar e compartilhar.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-lime-600 mt-1" />
              <span>
                <strong>Qualidade de ponta a ponta</strong>: coleta cuidadosa,
                cadeia de custódia e protocolos padronizados.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-lime-600 mt-1" />
              <span>
                <strong>Agendamento simples</strong> e horários que se encaixam
                na sua rotina, sem complicação.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-lime-600 mt-1" />
              <span>
                <strong>Atendimento próximo</strong> via WhatsApp e suporte para
                dúvidas antes e depois do exame.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Parte do que tem na HOME */}
      <div className="container mx-auto px-4 text-center mt-40 mb-30">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
          Sua saúde merece o melhor:
        </h2>
        <p className="text-5xl md:text-6xl font-bold text-lime-600 mb-12">
          Tecnologia e qualidade em cada exame
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="flex flex-col items-center p-4 mt-10">
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
          <div className="flex flex-col items-center p-4 mt-10">
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
          <div className="flex flex-col items-center p-4 mt-10">
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
          <div className="flex flex-col items-center p-4 mt-10">
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
          <div className="flex flex-col items-center p-4 mt-10">
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

export default AboutUsSection;
