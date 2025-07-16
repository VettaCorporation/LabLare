// components/ContactSection/ContactSection.tsx
"use client";

import Image from 'next/image';
import MapaLocalizacao from '../../../public/assets/img/mapa-localizacao.png';

const ContactSection: React.FC = () => {
  return (
    <section className="bg-[#0047AB] py-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 w-full text-white">
          <h2 className="text-3xl font-bold mb-8 text-center md:text-left">NOS CONTATE</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="sr-only">Nome</label>
              <input
                type="text"
                id="name"
                placeholder="Nome"
                className="w-full px-5 py-3 rounded-md bg-[#005ABF] text-white placeholder-gray-300 border border-[#005ABF] focus:outline-none focus:ring-2 focus:ring-[#3CB371]"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Email"
                className="w-full px-5 py-3 rounded-md bg-[#005ABF] text-white placeholder-gray-300 border border-[#005ABF] focus:outline-none focus:ring-2 focus:ring-[#3CB371]"
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">Telefone</label>
              <input
                type="tel"
                id="phone"
                placeholder="Telefone"
                className="w-full px-5 py-3 rounded-md bg-[#005ABF] text-white placeholder-gray-300 border border-[#005ABF] focus:outline-none focus:ring-2 focus:ring-[#3CB371]"
              />
            </div>
            <div>
              <label htmlFor="message" className="sr-only">Mensagem</label>
              <textarea
                id="message"
                placeholder="Mensagem"
                rows={5}
                className="w-full px-5 py-3 rounded-md bg-[#005ABF] text-white placeholder-gray-300 border border-[#005ABF] focus:outline-none focus:ring-2 focus:ring-[#3CB371] resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-[#3CB371] hover:bg-[#349860] text-white font-semibold py-3 rounded-md transition-colors duration-200 text-lg shadow-lg"
            >
              Enviar mensagem
            </button>
          </form>
        </div>

        <div className="md:w-1/2 w-full flex flex-col justify-center items-center md:items-end text-center md:text-right mt-10 md:mt-0">
          <p className="text-sm text-white mb-2">Para mais informações,</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">NOS CONTATE</h1>
          <button
            type="submit" // Considerar que este botão enviará o formulário do lado esquerdo.
                          // Se o formulário tiver um 'id', este botão pode ser 'form="form-id-aqui"'
            className="w-full md:w-auto bg-[#3CB371] hover:bg-[#349860] text-white font-semibold py-3 px-12 rounded-md transition-colors duration-200 text-lg shadow-lg"
          >
            Enviar Mensagem
          </button>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;