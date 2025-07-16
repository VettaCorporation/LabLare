'use client';

import React, { useState, useEffect } from 'react';

// 1. A interface de props agora deve incluir `onCancel`
interface RegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onCancel }) => {
  const [nome_completo, setNome_completo] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [idPerfilSelecionado, setIdPerfilSelecionado] = useState<number | ''>('');
  const [perfis, setPerfis] = useState<any[]>([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setSucesso('');

    if (!nome_completo || !email || !senha || !confirmarSenha || idPerfilSelecionado === '') {
      setErro('Por favor, preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_completo, email, senha, id_perfil: idPerfilSelecionado }),
      });
      const data = await response.json();
      if (response.ok) {
        setSucesso('Colaborador cadastrado com sucesso!');
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        }
      } else {
        setErro(data.error || 'Erro ao criar conta.');
      }
    } catch (apiError) {
      setErro('Ocorreu um erro inesperado.');
    }
  };

  useEffect(() => {
    const fetchPerfis = async () => {
      try {
        const response = await fetch('/api/auth/perfis');
        const data = await response.json();
        setPerfis(data);
      } catch (err) {
        setErro('Não foi possível carregar os tipos de perfil.');
      }
    };
    fetchPerfis();
  }, []);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Cadastro de Novo Colaborador</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input type="text" id="nomeCompleto" value={nome_completo} onChange={(e) => setNome_completo(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Nome do colaborador" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="email@dominio.com" />
          </div>
          <div>
            <label htmlFor="perfil" className="block text-sm font-medium text-gray-700">Tipo de Perfil</label>
            <select id="perfil" value={idPerfilSelecionado} onChange={(e) => setIdPerfilSelecionado(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="" disabled>Selecione um perfil</option>
              {perfis.map((perfil) => (
                <option key={perfil.id_perfil} value={perfil.id_perfil}>{perfil.nome_perfil}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2"></div>
          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700">Senha</label>
            <input type="password" id="senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="********" />
          </div>
          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
            <input type="password" id="confirmarSenha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="********" />
          </div>
        </div>

        {erro && <div className="mt-4 text-red-600 text-sm">{erro}</div>}
        {sucesso && <div className="mt-4 text-green-600 text-sm">{sucesso}</div>}

        {/* 2. A seção de botões agora inclui o botão Cancelar que usa a prop `onCancel` */}
        <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end gap-4">
          <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
            Salvar Colaborador
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;