// components/ContactSection/ContactSection.tsx
"use client";

import Image from 'next/image';
import MapaLocalizacao from '../../../public/assets/img/mapa-localizacao.png';
import { useState, FormEvent } from 'react'; // Importamos useState e FormEvent

// Interface para tipar os dados do formulário
interface FormData {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
}

const ContactSection: React.FC = () => {
  // Estados para os campos do formulário
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    telefone: "",
    mensagem: "",
  });

  // Estados para feedback de envio
  const [isSending, setIsSending] = useState(false);
  const [formStatus, setFormStatus] = useState<"success" | "error" | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Função para atualizar o estado quando o usuário digita
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target; // Usamos `name` para identificar o campo
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Função principal: lidar com o envio do formulário
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Previne o recarregamento padrão da página

    setIsSending(true);
    setFormStatus(null); // Limpa o status anterior
    setStatusMessage("");

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Envia os dados do formulário como JSON
      });

      const result = await response.json();

      if (response.ok) {
        setFormStatus("success");
        setStatusMessage("Mensagem enviada com sucesso! Obrigado pelo seu contato.");
        // Limpa o formulário após o sucesso
        setFormData({
          nome: "",
          email: "",
          telefone: "",
          mensagem: "",
        });
      } else {
        setFormStatus("error");
        setStatusMessage(result.error || "Ocorreu um erro ao enviar a mensagem. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro no envio do formulário:", error);
      setFormStatus("error");
      setStatusMessage("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSending(false); // Finaliza o estado de envio
    }
  };

  return (
    <section className="bg-[#003580] py-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 w-full text-white">
          {/* Conecta o onSubmit ao seu formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="sr-only">
                Nome
              </label>
              <input
                type="text"
                id="name"
                name="nome" // Adicionado name="nome"
                placeholder="Nome"
                value={formData.nome} // Conecta ao estado
                onChange={handleChange} // Lida com as mudanças
                required // Campo obrigatório
                className="w-[556px] px-7 py-4 bg-white rounded-2xl outline outline-offset-[-1px] outline-lime-600 inline-flex justify-start items-start gap-2.5 overflow-hidden text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email" // Adicionado name="email"
                placeholder="Email"
                value={formData.email} // Conecta ao estado
                onChange={handleChange} // Lida com as mudanças
                required // Campo obrigatório
                className="w-[556px] px-7 py-4 bg-white rounded-2xl outline outline-offset-[-1px] outline-lime-600 inline-flex justify-start items-start gap-2.5 overflow-hidden text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                name="telefone" // Adicionado name="telefone"
                placeholder="Telefone"
                value={formData.telefone} // Conecta ao estado
                onChange={handleChange} // Lida com as mudanças
                className="w-[556px] px-7 py-4 bg-white rounded-2xl outline outline-offset-[-1px] outline-lime-600 inline-flex justify-start items-start gap-2.5 overflow-hidden text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="message" className="sr-only">
                Mensagem
              </label>
              <textarea
                id="message"
                name="mensagem" // Adicionado name="mensagem"
                placeholder="Mensagem"
                rows={5}
                value={formData.mensagem} // Conecta ao estado
                onChange={handleChange} // Lida com as mudanças
                required // Campo obrigatório
                className="w-[556px] px-7 py-4 bg-white rounded-2xl outline outline-offset-[-1px] outline-lime-600 inline-flex justify-start items-start gap-2.5 overflow-hidden text-gray-800"
              ></textarea>
            </div>

            {/* Mensagens de feedback */}
            {formStatus === "success" && (
              <p className="text-lime-300 text-base mt-2">{statusMessage}</p>
            )}
            {formStatus === "error" && (
              <p className="text-red-500 text-base mt-2">{statusMessage}</p>
            )}

            {/* Seu botão de envio agora é um submit e tem o disabled */}
            <button
              type="submit" // Alterado para type="submit"
              disabled={isSending} // Desabilita enquanto envia
              className={`
                group relative
                w-96 h-14 px-9 py-5
                bg-lime-500 rounded-[5px]
                inline-flex justify-center items-center gap-2.5
                text-white text-xl font-light mt-3 font-sans leading-7
                transition-all duration-150
                hover:brightness-110 active:scale-95
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-500
                ${isSending ? 'opacity-70 cursor-not-allowed' : ''} // Estilo para disabled
              `}
            >
              {isSending ? "Enviando..." : "Enviar Mensagem"}
              <span
                className="
                  pointer-events-none absolute inset-0
                  opacity-0 group-active:opacity-100
                  transition-opacity duration-150
                  bg-white/10
                "
              />
            </button>
          </form>
        </div>

        <div className="md:w-1/2 w-full flex flex-col items-center">
          <div className="w-[691px] inline-flex flex-col justify-start items-center gap-[5px] overflow-hidden">
            <div className="text-center justify-start text-lime-300 text-xl font-semibold font-montserrat leading-normal tracking-tight">
              Para mais informações,
            </div>
            <div className="text-center justify-start text-white text-5xl font-bold font-sans leading-[50px] tracking-tight">
              NOS CONTATE
            </div>
            {/* O botão anterior foi movido para dentro do <form> e agora é do tipo "submit" */}
          </div>
          {/* Se você tiver o MapaLocalizacao, pode manter aqui se ele não fizer parte do formulário */}
          {/* <Image
            src={MapaLocalizacao}
            alt="Mapa de Localização"
            width={600}
            height={400}
            className="mt-8 rounded-lg shadow-lg"
          /> */}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;