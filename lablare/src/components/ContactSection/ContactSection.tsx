// components/ContactSection/ContactSection.tsx
"use client";

import Image from 'next/image';
import MapaLocalizacao from '../../../public/assets/img/mapa-localizacao.png';

const ContactSection: React.FC = () => {
  return (
    <section className="bg-[#003580] py-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 w-full text-white">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="sr-only">
                Nome
              </label>
              <input
                type="text"
                id="name"
                placeholder="Nome"
                className="w-[556px] px-7 py-4 bg-white rounded-2xl outline outline-offset-[-1px] outline-lime-600 inline-flex justify-start items-start gap-2.5 overflow-hidden"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Email"
                className="w-[556px] px-7 py-4 bg-white rounded-2xl outline outline-offset-[-1px] outline-lime-600 inline-flex justify-start items-start gap-2.5 overflow-hidden"
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                placeholder="Telefone"
                className="w-[556px] px-7 py-4 bg-white rounded-2xl outline outline-offset-[-1px] outline-lime-600 inline-flex justify-start items-start gap-2.5 overflow-hidden"
              />
            </div>
            <div>
              <label htmlFor="message" className="sr-only">
                Mensagem
              </label>
              <textarea
                id="message"
                placeholder="Mensagem"
                rows={5}
                className="w-[556px] px-7 py-4 bg-white rounded-2xl outline outline-offset-[-1px] outline-lime-600 inline-flex justify-start items-start gap-2.5 overflow-hidden"
              ></textarea>
            </div>
          </form>
        </div>

        <div className="w-[691px] inline-flex flex-col justify-start items-center gap-[5px] overflow-hidden">
          <div className="text-center justify-start text-lime-300 text-xl font-semibold font-montserrat leading-normal tracking-tight">
            Para mais informações,
          </div>
          <div className="text-center justify-start text-white text-5xl font-bold font-sans leading-[50px] tracking-tight">
            NOS CONTATE
          </div>
          <button
            type="button"
            onClick={() => {
              /* sua ação aqui */
            }}
            className="
            group relative
            w-96 h-14 px-9 py-5
            bg-lime-500 rounded-[5px]
            inline-flex justify-center items-center gap-2.5
            text-white text-xl font-light mt-3 font-sans leading-7
            transition-all duration-150
            hover:brightness-110 active:scale-95
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-500
          "
                  >
                    Enviar Mensagem
                    <span
                      className="
              pointer-events-none absolute inset-0
              opacity-0 group-active:opacity-100
              transition-opacity duration-150
              bg-white/10
            "
            />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;