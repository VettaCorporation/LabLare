// src/app/reset-password/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import LogoLab from '../../../public/assets/img/Logo.png';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTokenValidating, setIsTokenValidating] = useState(true); // Estado para indicar que o token está sendo validado
  const [tokenValid, setTokenValid] = useState(false); // Indica se o token de validação é válido
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const validationToken = searchParams.get('validationToken'); // Pega o NOVO token de validação da URL

  // Efeito para validar o token de validação assim que a página carrega
  useEffect(() => {
    const validateValidationToken = async () => {
      if (!validationToken) {
        setError('Token de validação não encontrado na URL. Por favor, comece o processo novamente.');
        setIsTokenValidating(false);
        return;
      }
      try {
        // Chamada para uma NOVA API de validação de token (se você quiser uma validação separada para este token)
        // Ou, se o token for um JWT assinado, a validação pode ser feita no backend na API de reset.
        // Por simplicidade, vamos verificar a existência do usuário com este token.
        const response = await fetch(`/api/auth/reset-password/validate-token-access?token=${validationToken}`); // NOVA API para validar o token de acesso
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Token de acesso inválido ou expirado. Por favor, solicite um novo código.');
        }
        setMessage(data.message || 'Token de acesso válido. Agora você pode definir sua nova senha.');
        setTokenValid(true);
      } catch (err: any) {
        setError(err.message || 'Erro ao validar o token de acesso.');
      } finally {
        setIsTokenValidating(false);
      }
    };
    validateValidationToken();
  }, [validationToken]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!tokenValid) { // Se o token de validação não é válido, não permite submeter
      setError('Token de acesso inválido ou expirado. Por favor, solicite um novo código.');
      setLoading(false);
      return;
    }

    if (password.length < 6) { 
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Envia o validationToken e a nova senha
        body: JSON.stringify({ token: validationToken, newPassword: password }), 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao redefinir a senha.');
      }

      setMessage(data.message || 'Senha redefinida com sucesso!');
      setPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        router.push('/login'); 
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Lare Laboratório - Redefinir Senha</title>
        <meta name="description" content="Redefina sua senha do sistema Lare Laboratório." />
      </Head>

      <div className="relative min-h-screen bg-white overflow-hidden flex flex-col items-center justify-center py-8 px-4">
        {/* Formas orgânicas de fundo */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[#0047AB] rounded-bl-[50%] transform translate-x-1/2 -translate-y-1/2 rotate-45 md:rotate-0"></div>
        <div className="absolute top-0 right-0 w-[350px] h-[350px] md:w-[550px] md:h-[550px] bg-[#0047AB] rounded-bl-[50%] transform translate-x-1/2 -translate-y-1/2 rotate-45 md:rotate-0 opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#007FFF] rounded-tr-[50%] transform -translate-x-1/2 translate-y-1/2 -rotate-45 md:-rotate-0"></div>
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] md:w-[450px] md:h-[450px] bg-[#007FFF] rounded-tr-[50%] transform -translate-x-1/2 translate-y-1/2 -rotate-45 md:-rotate-0 opacity-80"></div>

        <div className="relative z-10 flex flex-col items-center max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <div className="mb-8 mt-16 md:mt-0">
            <Link href="/">
              <Image src={LogoLab} alt="Lare Laboratório Logo" width={180} height={56} priority />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Redefinir Senha</h1>

          {isTokenValidating ? (
            <p className="text-gray-500">Validando acesso...</p>
          ) : (
            <>
              {error && <div className="text-red-500 text-xs italic mt-2 text-center">{error}</div>}
              {message && <div className="text-green-600 text-xs italic mt-2 text-center">{message}</div>}

              {tokenValid ? ( // Só mostra o formulário se o token de validação for válido
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                  {/* Campos de Nova Senha e Confirmação */}
                  <div className="relative">
                    <label htmlFor="password" className="sr-only">Nova Senha</label>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 11V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2"></path></svg>
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-3 px-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Nova Senha"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label htmlFor="confirmPassword" className="sr-only">Confirmar Nova Senha</label>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 11V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2"></path></svg>
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-3 px-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Confirmar Nova Senha"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 shadow-md"
                    disabled={loading}
                  >
                    {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                  </button>
                </form>
              ) : (
                // Mensagem se o token não for válido
                <p className="text-gray-600 text-center">
                  Por favor, solicite um novo código de redefinição de senha.
                </p>
              )}
            </>
          )}

          <p className="text-gray-600 text-sm mt-8 text-center">
            &copy; {new Date().getFullYear()} Todos Direitos Reservados
          </p>
        </div>
      </div>
    </>
  );
}
