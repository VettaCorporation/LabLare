'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


interface Perfil {
  id_perfil: number;
  nome_perfil: string;
}

const RegisterForm: React.FC = () => {
  const [nome_completo, setNome_completo] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [idPerfilSelecionado, setIdPerfilSelecionado] = useState<number | ''>(''); 
  const [perfis, setPerfis] = useState<Perfil[]>([]); 
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const router = useRouter();

 
  useEffect(() => {
    const fetchPerfis = async () => {
      try {
        const response = await fetch('/api/auth/perfis');
        if (!response.ok) {
          throw new Error('Falha ao buscar perfis.');
        }
        const data: Perfil[] = await response.json();
        setPerfis(data);
        
        if (data.length > 0 && idPerfilSelecionado === '') {
          setIdPerfilSelecionado(data[0].id_perfil); 
        }
      } catch (err) {
        console.error('Erro ao carregar perfis:', err);
        setErro('Não foi possível carregar os tipos de perfil.');
      }
    };
    fetchPerfis();
  }, []); 

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setSucesso('');

    if (!nome_completo || !email || !senha || !confirmarSenha || idPerfilSelecionado === '') {
      setErro('Por favor, preencha todos os campos e selecione um perfil.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErro('Por favor, insira um e-mail válido.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_completo,
          email,
          senha,
          id_perfil: idPerfilSelecionado, // Envia o ID do perfil selecionado
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso(data.message || 'Conta criada com sucesso!');
        setTimeout(() => {
          router.push('/'); // Redireciona para a tela de login
        }, 2000);
      } else {
        setErro(data.error || 'Erro ao criar conta. Tente novamente.');
      }
    } catch (apiError) {
      console.error('Erro na requisição de registro:', apiError);
      setErro('Ocorreu um erro inesperado. Tente novamente mais tarde.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 md:w-96 p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Criar Conta</h2>

      {/* Campo Nome Completo */}
      <div>
        <label htmlFor="nomeCompleto" className="block text-gray-700 text-sm font-bold mb-2">
          Nome Completo
        </label>
        <input
          type="text"
          id="nomeCompleto"
          value={nome_completo}
          onChange={(e) => setNome_completo(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Seu nome completo"
        />
      </div>

      {/* Campo E-mail */}
      <div>
        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
          E-mail
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="seu@email.com"
        />
      </div>

      {/* Dropdown de Perfil */}


      <div>
        <label htmlFor="perfil" className="block text-gray-700 text-sm font-bold mb-2">
          Tipo de Perfil
        </label>
        <select
          id="perfil"
          value={idPerfilSelecionado}
          onChange={(e) => setIdPerfilSelecionado(Number(e.target.value))}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="" disabled>Selecione um perfil</option>
          {perfis.map((perfil) => (
            <option key={perfil.id_perfil} value={perfil.id_perfil}>
              {perfil.nome_perfil}
            </option>
          ))}
        </select>
      </div>

      {/* Campo Senha */}
      <div>
        <label htmlFor="senha" className="block text-gray-700 text-sm font-bold mb-2">
          Senha
        </label>
        <input
          type="password"
          id="senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="********"
        />
      </div>

      {/* Campo Confirmar Senha */}
      <div>
        <label htmlFor="confirmarSenha" className="block text-gray-700 text-sm font-bold mb-2">
          Confirmar Senha
        </label>
        <input
          type="password"
          id="confirmarSenha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="********"
        />
      </div>

      {/* Mensagens de Erro/Sucesso */}
      {erro && <div className="text-red-500 text-xs italic mt-2">{erro}</div>}
      {sucesso && <div className="text-green-500 text-xs italic mt-2">{sucesso}</div>}

      {/* Botão Registrar */}
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
      >
        Registrar
      </button>
    </form>
  );
};

export default RegisterForm;