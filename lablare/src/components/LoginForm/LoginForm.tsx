'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  userLabel?: 'CPF' | 'LOGIN' | 'Usuário';
}

const LoginForm: React.FC<LoginFormProps> = ({ userLabel = 'Usuário' }) => {
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

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: usuario, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login bem-sucedido:', data);
        router.push('/dashboard');
      } else {
        setErro(data.error || 'Erro ao fazer login. Tente novamente.');
      }
    } catch (apiError) {
      console.error('Erro na requisição de login:', apiError);
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
      <Link href="/register" className="inline-block align-baseline text-sm text-blue-500 hover:text-blue-800 text-center mt-2">
        Não tem uma conta? Crie agora!
      </Link>
    </form>
  );
};

export default LoginForm;