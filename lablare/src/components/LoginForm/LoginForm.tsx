// src/components/LoginForm/LoginForm.tsx
'use client'; // Mantenha esta diretiva no topo!

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface LoginFormProps {
  userLabel?: 'CPF' | 'LOGIN' | 'Usuário';
}

const LoginForm: React.FC<LoginFormProps> = ({ userLabel = 'Usuário' }) => {
  const [usuario, setUsuario] = useState(''); // Será o email
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

    try {
      const result = await signIn('credentials', {
        email: usuario,
        senha: senha,
        redirect: false,
      });

      if (result?.error) {
        setErro('Usuário ou senha inválidos.');
        console.error('Erro de login:', result.error);
      } else if (result?.ok) {
        console.log('Login bem-sucedido!');
        router.push('/dashboard');
      }
    } catch (apiError) {
      console.error('Erro inesperado durante o login:', apiError);
      setErro('Ocorreu um erro inesperado. Tente novamente mais tarde.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 md:w-96 p-8 bg-white rounded-lg shadow-md">
      <div>
        <label htmlFor="usuario" className="block text-gray-700 text-sm font-bold mb-2">
          {userLabel}
        </label>
        <input
          type="text"
          id="usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder={`Seu ${userLabel.toLowerCase()}`}
        />
      </div>
      <div>
        <label htmlFor="senha" className="block text-gray-700 text-sm font-bold mb-2">
          Senha
        </label>
        <input
          type="password"
          id="senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="********"
        />
      </div>
      {erro && <div className="text-red-500 text-xs italic mt-2">{erro}</div>}
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
      >
        LOGIN
      </button>
      <Link href="/esqueci-senha" className="inline-block align-baseline text-sm text-blue-500 hover:text-blue-800 text-center mt-4">
        Esqueceu a senha?
      </Link>
      {/* REMOVIDO: O link para a página de registro */}
      {/* <Link href="/register" className="inline-block align-baseline text-sm text-blue-500 hover:text-blue-800 text-center mt-2">
        Não tem uma conta? Crie agora!
      </Link> */}
    </form>
  );
};

export default LoginForm;