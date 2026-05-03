// Caminho: src/components/RegisterForm/RegisterForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

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
  
  const [senhasVisiveis, setSenhasVisiveis] = useState(false);

  // A lógica de submit e fetch de perfis continua a mesma
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Impede o recarregamento da página
    setErro('');
    setSucesso('');

    // 1. Validação dos campos no frontend
    if (!nome_completo || !email || !idPerfilSelecionado || !senha || !confirmarSenha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) { // Exemplo de regra de senha
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    // 2. Envio dos dados para a API
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_completo: nome_completo,
          email: email,
          senha: senha,
          id_perfil: idPerfilSelecionado,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se a API retornar um erro (ex: e-mail já existe), mostra aqui
        throw new Error(data.error || 'Falha ao cadastrar colaborador.');
      }

      setSucesso('Colaborador cadastrado com sucesso!');
      
      // Limpa o formulário e chama a função de sucesso (que atualiza a lista na página)
      if (onSuccess) {
        onSuccess();
      }

    } catch (err: any) {
      setErro(err.message);
      console.error('Erro ao cadastrar:', err);
    }
  };
  
  useEffect(() => {
    // Função assíncrona para buscar os perfis da API
    const fetchPerfis = async () => {
      try {
        const response = await fetch('/api/auth/perfis'); // Faz a chamada para a sua API de perfis
        if (!response.ok) {
          throw new Error('Falha ao buscar perfis.');
        }
        const data = await response.json();
        setPerfis(data); // Atualiza o estado com a lista de perfis recebida
      } catch (err) {
        // Define uma mensagem de erro se a busca falhar
        setErro('Não foi possível carregar os perfis. Tente novamente mais tarde.');
        console.error(err);
      }
    };

    fetchPerfis(); // Executa a função de busca
  }, []); // O array vazio [] garante que isso só rode uma vez, quando o componente é montado

  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Cadastro de Novo Colaborador</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
            <input type="text" id="nomeCompleto" value={nome_completo} onChange={(e) => setNome_completo(e.target.value)} placeholder="Nome do colaborador" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com" />
          </div>
          <div>
            <label htmlFor="perfil" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Perfil</label>
            <select id="perfil" value={idPerfilSelecionado} onChange={(e) => setIdPerfilSelecionado(Number(e.target.value))}>
              <option value="" disabled>Selecione um perfil</option>
              {perfis.map((perfil) => (
                <option key={perfil.id_perfil} value={perfil.id_perfil}>{perfil.nome_perfil}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2"></div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
            <div className="relative mt-1">
              <input 
                type={senhasVisiveis ? 'text' : 'password'}
                id="senha" 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                placeholder="********" 
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setSenhasVisiveis(!senhasVisiveis)}
                aria-label={senhasVisiveis ? "Esconder senhas" : "Mostrar senhas"}
              >
                {senhasVisiveis ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Senha</label>
            <div className="relative mt-1">
              <input 
                type={senhasVisiveis ? 'text' : 'password'}
                id="confirmarSenha" 
                value={confirmarSenha} 
                onChange={(e) => setConfirmarSenha(e.target.value)} 
                placeholder="********" 
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setSenhasVisiveis(!senhasVisiveis)}
                aria-label={senhasVisiveis ? "Esconder senhas" : "Mostrar senhas"}
              >
                {senhasVisiveis ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {erro && <div className="mt-4 text-red-600 text-sm">{erro}</div>}
        {sucesso && <div className="mt-4 text-green-600 text-sm">{sucesso}</div>}

        <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
          <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
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