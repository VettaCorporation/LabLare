"use client";

import Image from "next/image";
import IconDoctorFaq from "../../../public/assets/img/icon-doctor-faq.png";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const faqs = [
    {
        question: "Como os exames são realizados?",
        answer: "Nossos exames são realizados por uma equipe de profissionais qualificados, utilizando equipamentos de última geração para garantir a precisão dos resultados. Seguimos rigorosos protocolos de segurança e higiene em todas as etapas do processo."
    },
    {
        question: "Preciso de agendamento prévio?",
        answer: "Para a maioria dos exames, o agendamento prévio é recomendado para garantir sua comodidade e evitar esperas. No entanto, também atendemos pacientes sem agendamento, sujeito à disponibilidade. Consulte a necessidade específica para o seu exame."
    },
    {
        question: "Quais convênios vocês aceitam?",
        answer: "Aceitamos uma ampla variedade de convênios de saúde. Para verificar se o seu convênio é aceito, entre em contato com nossa central de atendimento ou visite a seção 'Convênios' em nosso site."
    },
    {
        question: "Como posso acessar meus resultados online?",
        answer: "Você pode acessar seus resultados de forma segura através do nosso 'Portal do Paciente'. Basta clicar em 'Resultados Online' no topo do site e fazer login com seu CPF e a senha fornecida no momento do atendimento."
    }
];

const FaqSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        // A cor de fundo e o padding são aplicados aqui, no container principal
        <section id="faq" className="bg-slate-50 py-24 sm:py-32">
            <div className="container mx-auto px-4">
                {/* Layout de duas colunas usando Flexbox */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-12 lg:gap-16">
                    
                    {/* Coluna da Imagem (Esquerda) */}
                    <div className="w-full md:w-1/3 flex justify-center">
                        <Image
                            src={IconDoctorFaq}
                            alt="Profissional de saúde para FAQ"
                            width={460} // Aumentei um pouco para melhor proporção
                            height={560}
                            className="rounded-lg object-cover" // object-cover previne distorção
                            priority
                        />
                    </div>

                    {/* Coluna do Conteúdo (Direita) */}
                    <div className="w-full md:w-2/3">
                        <h3 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-12 text-center md:text-left font-sans">
                            Dúvidas Frequentes
                        </h3>

                        <dl className="space-y-4">
                            {faqs.map((faq, index) => {
                                const isOpen = openIndex === index;
                                return (
                                    <div key={index} className={`rounded-lg bg-white shadow-sm border transition-all duration-300 ${isOpen ? 'border-green-300' : 'border-gray-200'}`}>
                                        <dt>
                                            <button
                                                onClick={() => toggleFaq(index)}
                                                className="flex w-full items-center justify-between p-6 text-left"
                                            >
                                                <span className={`text-base font-semibold leading-7 transition-colors duration-300 ${isOpen ? 'text-green-700' : 'text-gray-900'}`}>{faq.question}</span>
                                                <span className="ml-6 flex h-7 items-center">
                                                    {isOpen ? (
                                                        <ChevronUpIcon className="h-6 w-6 text-green-600" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                                                    )}
                                                </span>
                                            </button>
                                        </dt>
                                        {isOpen && (
                                            <dd className="px-6 pb-6 animate-fade-in">
                                                <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                                            </dd>
                                        )}
                                    </div>
                                )
                            })}
                        </dl>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FaqSection;