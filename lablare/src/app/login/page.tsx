// src/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import LoginForm from '../../components/LoginForm/LoginForm'; // Ajuste o caminho conforme sua estrutura
import LogoLab from '../../../public/assets/img/Logo.png'; // Verifique o caminho real do seu logo

// Definição dos tipos de perfil e suas características visuais
type Perfil = {
  id: 'cliente' | 'admin';
  label: string;
  userLabelForm: 'CPF' | 'LOGIN'; // Como o campo de usuário será chamado no formulário
  buttonBgColor: string; // Cor de fundo do botão de seleção
  buttonTextColor: string; // Cor do texto do botão de seleção
  loginBtnBgColor: string; // Cor de fundo do botão "LOGIN" do formulário
  loginBtnHoverBgColor: string; // Cor de hover do botão "LOGIN"
};

// Dados dos perfis
const perfis: Perfil[] = [
  { id: 'cliente', label: 'CLIENTE', userLabelForm: 'CPF', buttonBgColor: 'bg-[#3CB371]', buttonTextColor: 'text-white', loginBtnBgColor: 'bg-[#3CB371]', loginBtnHoverBgColor: 'hover:bg-[#349860]' },
  { id: 'admin', label: 'ADMIN', userLabelForm: 'LOGIN', buttonBgColor: 'bg-[#0047AB]', buttonTextColor: 'text-white', loginBtnBgColor: 'bg-[#0047AB]', loginBtnHoverBgColor: 'hover:bg-[#003A8D]' },
];

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [perfilAtivo, setPerfilAtivo] = useState<Perfil>(perfis[0]); // Inicia com 'cliente'

  const handleGoBack = () => {
    router.back(); // Volta para a página anterior no histórico
  };

  return (
    <>
      <Head>
        <title>Lare Laboratório - Login Page - {perfilAtivo.label}</title>
        <meta name="description" content={`Faça login como ${perfilAtivo.label.toLowerCase()} na sua conta Lare Laboratório.`} />
      </Head>

      {/* Container principal com as formas de fundo */}
      <div className="relative min-h-screen bg-white overflow-hidden flex flex-col items-center justify-center py-8 px-4">

        {/* Forma orgânica superior direita (azul escuro) */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[#0047AB] rounded-bl-[50%] transform translate-x-1/2 -translate-y-1/2 rotate-45 md:rotate-0"></div>
        <div className="absolute top-0 right-0 w-[350px] h-[350px] md:w-[550px] md:h-[550px] bg-[#0047AB] rounded-bl-[50%] transform translate-x-1/2 -translate-y-1/2 rotate-45 md:rotate-0 opacity-80"></div>


        {/* Forma orgânica inferior esquerda (azul claro) */}
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#007FFF] rounded-tr-[50%] transform -translate-x-1/2 translate-y-1/2 -rotate-45 md:-rotate-0"></div>
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] md:w-[450px] md:h-[450px] bg-[#007FFF] rounded-tr-[50%] transform -translate-x-1/2 translate-y-1/2 -rotate-45 md:-rotate-0 opacity-80"></div>


        {/* Botão "Voltar" */}
        <button
          onClick={handleGoBack}
          className="absolute top-8 left-8 bg-[#0047AB] text-white px-4 py-2 rounded-md flex items-center shadow-lg hover:bg-[#003A8D] transition duration-200 z-20"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Voltar
        </button>

        {/* Conteúdo central (Logo, botões de perfil, formulário, direitos autorais) */}
        <div className="relative z-10 flex flex-col items-center max-w-md w-full">
          {/* Logo do laboratório */}
          <div className="mb-8 mt-16 md:mt-0">
            <Link href="/">
              <Image
                src={LogoLab}
                alt="Lare Laboratório Logo"
                width={180}
                height={56}
                priority
              />
            </Link>
          </div>

          {/* Botões de seleção de perfil (CLIENTE / ADMIN) */}
          <div className="flex justify-center border border-gray-300 rounded-lg p-1 mb-8">
            {perfis.map((perfil) => (
              <button
                key={perfil.id}
                onClick={() => setPerfilAtivo(perfil)}
                className={`
                  w-36 text-center py-2 px-4 rounded-md font-semibold text-sm transition-colors duration-300
                  ${perfilAtivo.id === perfil.id
                    ? perfil.buttonBgColor + ' ' + perfil.buttonTextColor + ' shadow-md'
                    : 'bg-white text-gray-700' // Fundo branco e texto cinza para o não-selecionado
                  }
                  ${perfilAtivo.id !== perfil.id ? 'hover:bg-gray-100' : ''}
                `}
              >
                {perfil.label}
              </button>
            ))}
          </div>

          {/* Componente LoginForm */}
          <LoginForm
            userLabel={perfilAtivo.userLabelForm}
            loginBtnBgColor={perfilAtivo.loginBtnBgColor}
            loginBtnHoverBgColor={perfilAtivo.loginBtnHoverBgColor}
          />

          {/* Direitos Autorais */}
          <p className="text-gray-600 text-sm mt-8 text-center">
            &copy; {new Date().getFullYear()} Todos Direitos Reservados
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;