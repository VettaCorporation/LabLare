// src/app/esqueci-senha/page.tsx
'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LogoLab from '../../../public/assets/img/Logo.png'; 

export default function ForgotPasswordPage() {
  const [emailIdentifier, setEmailIdentifier] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/login'); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!emailIdentifier.trim()) {
      setError('Por favor, insira seu e-mail.');
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(emailIdentifier)) {
      setError('Por favor, insira um formato de e-mail válido.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailIdentifier }), 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na solicitação de redefinição.');
      }

      // --- MUDANÇA AQUI: Redireciona para a tela de entrada de OTP imediatamente ---
      router.push(`/enter-otp?email=${encodeURIComponent(emailIdentifier)}`);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado na solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Lare Laboratório - Recuperar Senha</title>
        <meta name="description" content="Recupere sua senha do sistema Lare Laboratório." />
      </Head>

      {/* Container principal com as formas de fundo */}
      <div className="relative min-h-screen bg-white overflow-hidden flex flex-col items-center justify-center">

        {/* Formas orgânicas de fundo */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[#0047AB] rounded-bl-[50%] transform translate-x-1/2 -translate-y-1/2 rotate-45 md:rotate-0"></div>
        <div className="absolute top-0 right-0 w-[350px] h-[350px] md:w-[550px] md:h-[550px] bg-[#0047AB] rounded-bl-[50%] transform translate-x-1/2 -translate-y-1/2 rotate-45 md:rotate-0 opacity-80"></div>
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

        {/* Conteúdo central */}
        <div className="relative z-10 flex flex-col items-center max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          {/* Logo */}
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

          {/* Título e Descrição */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Esqueci a Senha</h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Digite seu e-mail e enviaremos um e-mail para você informando como recuperá-la.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* Campo de E-MAIL */}
            <div className="relative">
              <label htmlFor="emailIdentifier" className="sr-only">E-mail</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v2m-6 4h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <input
                type="email" 
                id="emailIdentifier"
                value={emailIdentifier}
                onChange={(e) => setEmailIdentifier(e.target.value)}
                className="shadow appearance-none border rounded w-full py-3 px-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="E-MAIL" 
                required 
              />
            </div>

            {/* Link "Lembrou a senha? Entrar" */}
            <p className="text-sm text-gray-600 text-center">
              Lembrou a senha?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-semibold">
                Entrar
              </Link>
            </p>

            {error && <div className="text-red-500 text-xs italic mt-2 text-center">{error}</div>}
            {/* Removido: {message && <div className="text-green-600 text-xs italic mt-2 text-center">{message}</div>} */}

            {/* Botão "RECUPERAR SENHA" */}
            <button
              type="submit"
              className="bg-[#3CB371] hover:bg-[#349860] text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 shadow-md"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'RECUPERAR SENHA'}
            </button>
          </form>

          {/* Direitos Autorais */}
          <p className="text-gray-600 text-sm mt-8 text-center">
            &copy; {new Date().getFullYear()} Todos Direitos Reservados
          </p>
        </div>
      </div>
    </>
  );
}
