// src/components/LoginForm/LoginForm.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface LoginFormProps {
  userLabel?: 'CPF' | 'LOGIN' | 'Usuário';
  loginBtnBgColor?: string;
  loginBtnHoverBgColor?: string;
  providerId: 'credentials-admin-recep' | 'credentials-paciente'; 
}

const LoginForm: React.FC<LoginFormProps> = ({
  userLabel = 'Usuário',
  loginBtnBgColor = 'bg-blue-500', 
  loginBtnHoverBgColor = 'hover:bg-blue-700', 
  providerId, 
}) => {
  const [usuario, setUsuario] = useState(''); 
  const [senha, setSenha] = useState(''); 
  const [erro, setErro] = useState('');
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');

    if (!usuario || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    // --- FIM DA NOVA VALIDAÇÃO ---


    let credentials: { [key: string]: string } = {};
    if (providerId === 'credentials-admin-recep') {
      credentials = { email: usuario, senha: senha };
    } else if (providerId === 'credentials-paciente') {
      credentials = { cpf: usuario, data_nascimento: senha }; 
    } else {
      setErro('Provedor de login inválido.');
      return;
    }

    try {
      const result = await signIn(providerId, { 
        ...credentials, 
        redirect: false, 
      });

      if (result?.error) {
        if (providerId === 'credentials-admin-recep') {
          setErro('Credencial ou senha incorreta.'); 
        } else if (providerId === 'credentials-paciente') {
          setErro('CPF ou senha incorreta.'); 
        } else {
          setErro('Erro de login. Tente novamente.'); 
        }
      } else if (result?.ok) {
        if (providerId === 'credentials-admin-recep') {
          router.push('/dashboard'); 
        } else if (providerId === 'credentials-paciente') {
          router.push('/portal-paciente'); 
        } else {
          router.push('/'); 
        }
      }
    } catch (apiError) {
      setErro('Ocorreu um erro inesperado. Tente novamente mais tarde.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 md:w-96 p-8 bg-white rounded-lg shadow-md">
      {/* Campo de Usuário (CPF ou Email) */}
      <div className="relative">
        <label htmlFor="usuario" className="sr-only">
          {userLabel}
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {userLabel === 'CPF' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          )}
        </div>
        <input
          type="text" 
          id="usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="shadow appearance-none border rounded w-full py-3 px-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder={`Seu ${userLabel.toLowerCase()}`}
        />
      </div>

      {/* Campo de Senha (ou Data de Nascimento oculta) */}
      <div className="relative">
        <label htmlFor="senha" className="sr-only">
          Senha
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 11V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2"></path></svg>
        </div>
        <input
          type="password" 
          id="senha"
          value={senha}
          onChange={(e) => {
            if (userLabel === 'CPF') {
              const numericValue = e.target.value.replace(/\D/g, ''); 
              setSenha(numericValue.slice(0, 8)); 
            } else {
              setSenha(e.target.value);
            }
          }}
          className="shadow appearance-none border rounded w-full py-3 px-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="********" 
          maxLength={userLabel === 'CPF' ? 8 : undefined} 
        />
      </div>

      {erro && <div className="text-red-500 text-xs italic mt-2 text-center">{erro}</div>}

      <button
        type="submit"
        className={`${loginBtnBgColor} ${loginBtnHoverBgColor} text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 shadow-md`}
      >
        LOGIN
      </button>

      <Link href="/esqueci-senha" className="inline-block align-baseline text-sm text-gray-500 hover:text-gray-800 text-center mt-2">
        Esqueceu a senha?
      </Link>
    </form>
  );
};

export default LoginForm;
