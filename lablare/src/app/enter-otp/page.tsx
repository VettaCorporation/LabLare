// src/app/enter-otp/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import LogoLab from '../../../public/assets/img/Logo.png'; 

export default function EnterOtpPage() {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']); // Array para cada dígito do OTP
  const [message, setMessage] = useState('Um código de 6 dígitos foi enviado para o seu e-mail.'); // Mensagem inicial consistente
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30); // Contagem para reenviar
  const [isResending, setIsResending] = useState(false); // Estado de reenvio
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email'); 
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); 

  // Efeito para iniciar/gerenciar a contagem regressiva do reenvio
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Handler para mudança de dígito no OTP
  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.toUpperCase(); 
    
    if (value.length > 1 || (value !== '' && !/^[A-Z0-9]$/.test(value))) {
        return; 
    }

    const newOtp = [...otp];
    newOtp[index] = value; 
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    setError(''); 
  };

  // Handler para Backspace/Delete
  const handleKeyDown = (element: HTMLInputElement, index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && element.value === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    setError('');
    setMessage(''); 
    setIsResending(true); 

    if (!emailFromUrl) {
      setError('E-mail não encontrado para reenviar o código. Por favor, volte e solicite novamente.');
      setIsResending(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailFromUrl }), 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao reenviar o código.');
      }

      setMessage('Um código de 6 dígitos foi enviado para o seu e-mail.'); // Mensagem consistente após reenvio
      setResendCountdown(30); 
      setOtp(['', '', '', '', '', '']); 
      inputRefs.current[0]?.focus(); 
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao tentar reenviar o código.');
    } finally {
      setIsResending(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const fullOtp = otp.join(''); 
    if (fullOtp.length !== 6) {
      setError('Por favor, insira o código completo de 6 dígitos.');
      setLoading(false);
      return;
    }

    if (!emailFromUrl) {
      setError('E-mail não encontrado para validar o código. Por favor, volte e solicite novamente.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password/validate-code', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailFromUrl, code: fullOtp }), 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Código inválido ou expirado.');
      }

      setMessage(data.message || 'Código validado com sucesso! Redirecionando para redefinição...');
      router.push(`/reset-password?validationToken=${encodeURIComponent(data.validationToken)}`);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao validar o código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Lare Laboratório - Validar Código</title>
        <meta name="description" content="Insira o código de 6 dígitos para redefinir sua senha." />
      </Head>

      <div className="relative min-h-screen bg-white overflow-hidden flex flex-col items-center justify-center py-8 px-4">
        {/* Formas orgânicas de fundo */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[#0047AB] rounded-bl-[50%] transform translate-x-1/2 -translate-y-1/2 rotate-45 md:rotate-0"></div>
        <div className="absolute top-0 right-0 w-[350px] h-[350px] md:w-[550px] md:h-[550px] bg-[#0047AB] rounded-bl-[50%] transform translate-x-1/2 -translate-y-1/2 rotate-45 md:rotate-0 opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#007FFF] rounded-tr-[50%] transform -translate-x-1/2 translate-y-1/2 -rotate-45 md:-rotate-0"></div>
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] md:w-[450px] md:h-[450px] bg-[#007FFF] rounded-tr-[50%] transform -translate-x-1/2 translate-y-1/2 -rotate-45 md:-rotate-0 opacity-80"></div>

        {/* Botão "Voltar" */}
        <button
          onClick={() => router.push('/esqueci-senha')} 
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
              <Image src={LogoLab} alt="Lare Laboratório Logo" width={180} height={56} priority />
            </Link>
          </div>

          {/* Título e Descrição */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Validar Código</h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Insira o código de 6 dígitos que enviamos para o seu e-mail.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* Campos para o Código OTP */}
            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }} 
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e.target as HTMLInputElement, index, e)}
                  onPaste={(e) => { 
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, ''); 
                    const newOtp = [...otp];
                    for (let i = 0; i < 6; i++) {
                      if (pastedData[i]) {
                        newOtp[i] = pastedData[i];
                      } else {
                        newOtp[i] = ''; 
                      }
                    }
                    setOtp(newOtp);
                    if (pastedData.length > 0) {
                      inputRefs.current[Math.min(pastedData.length - 1, 5)]?.focus();
                    }
                    setError('');
                  }}
                  className="w-10 h-10 text-center text-2xl font-bold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              ))}
            </div>

            {/* Botão de Reenviar Código com Cooldown */}
            <div className="text-center mt-2 flex items-center justify-center gap-2">
              {resendCountdown === 0 ? (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="text-blue-600 hover:underline text-sm font-semibold"
                >
                  {isResending ? 'Enviando novo código...' : 'Reenviar Código'}
                </button>
              ) : (
                <p className="text-gray-500 text-sm">
                  Reenviar novamente em {resendCountdown} segundos
                </p>
              )}
            </div>

            {error && <div className="text-red-500 text-xs italic mt-2 text-center">{error}</div>}
            {message && <div className="text-green-600 text-xs italic mt-2 text-center">{message}</div>}

            {/* Botão "Validar Código" */}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 shadow-md"
              disabled={loading}
            >
              {loading ? 'Validando...' : 'Validar Código'}
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
