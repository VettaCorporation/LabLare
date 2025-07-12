// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // NOVO: Importando o hook de rota

export default function LoginPage() {
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [message, setMessage] = useState('');

  const router = useRouter(); // NOVO: Inicializando o router

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Limpa a mensagem antes de tentar
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_completo: registerName, email: registerEmail, senha: registerPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Cadastro realizado com sucesso! Agora você pode fazer o login.');
    } else {
      setMessage(`Erro no cadastro: ${data.error}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Limpa a mensagem antes de tentar
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, senha: loginPassword }),
    });

    if (res.ok) {
      // MODIFICADO: Em vez de mostrar uma mensagem, navegamos para o dashboard
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setMessage(`Erro no login: ${data.error}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">LabLare</h1>
        {message && <p className="mb-4 text-center text-red-500">{message}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-center">Cadastro</h2>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nome Completo"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="p-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="E-mail"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="p-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="p-2 border rounded"
                required
              />
              <button type="submit" className="p-2 bg-blue-500 text-white rounded">
                Cadastrar
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="E-mail"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="p-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="p-2 border rounded"
                required
              />
              <button type="submit" className="p-2 bg-green-500 text-white rounded">
                Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}