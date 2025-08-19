// Caminho: src/components/PacienteCadastroForm/PacienteCadastroForm.tsx
'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { isValidCPF } from '@/utils/cpfValidator';
import { formatCpfOnType } from '@/utils/cpfFormatter';

// --- INTERFACES ---
// Nenhuma alteração aqui, as interfaces estão bem definidas.
interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo?: string | null;
  email?: string | null;
}

interface PacienteCadastroFormProps {
  onPatientSaved: (patient: Paciente) => void;
  onCancel: () => void;
  initialData?: Paciente | null;
}

// --- ESTADO INICIAL ---
// Mover o estado inicial para uma constante limpa o `useState`
const initialState = {
  nome_completo: '',
  cpf: '',
  data_nascimento: '',
  sexo: '',
  email: '',
};

// --- COMPONENTE PRINCIPAL ---
export default function PacienteCadastroForm({ onPatientSaved, onCancel, initialData }: PacienteCadastroFormProps) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Melhoria: Estado de feedback mais robusto
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  // O `useEffect` para popular os dados de edição está correto.
  useEffect(() => {
    if (initialData) {
      setFormData({
        nome_completo: initialData.nome_completo,
        cpf: initialData.cpf,
        // Garantir que a data esteja no formato YYYY-MM-DD
        data_nascimento: new Date(initialData.data_nascimento).toISOString().split('T')[0],
        sexo: initialData.sexo || '',
        email: initialData.email || '',
      });
    } else {
      // Garante que o formulário limpe se `initialData` mudar para nulo
      setFormData(initialState);
    }
  }, [initialData]);

  // A lógica de validação está correta. Nenhuma alteração necessária.
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nome_completo.trim()) {
      newErrors.nome_completo = 'O nome completo é obrigatório.';
    }
    if (!formData.cpf || !isValidCPF(formData.cpf)) {
      newErrors.cpf = 'O CPF fornecido é inválido.';
    }
    if (!formData.data_nascimento) {
      newErrors.data_nascimento = 'A data de nascimento é obrigatória.';
    }
    // Validação opcional para email
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'O formato do email é inválido.'
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Centraliza a lógica de mudança de campo
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Limpa o erro do campo ao começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Formatação específica para CPF
    if (name === 'cpf') {
      const formattedCpf = formatCpfOnType(value);
      setFormData(prev => ({ ...prev, cpf: formattedCpf }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // A lógica de submit está correta, apenas ajustamos o feedback
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormStatus(null); // Limpa a mensagem anterior
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/pacientes/${initialData?.id_paciente}` : '/api/pacientes';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar o paciente.');
      }

      const result = await response.json();
      onPatientSaved(result);
      setFormStatus({ type: 'success', message: 'Paciente salvo com sucesso!' });

      if (!isEditing) {
        setFormData(initialState); // Limpa o formulário após o sucesso
      }
    } catch (error: any) {
      console.error("Erro ao salvar paciente:", error);
      setFormStatus({ type: 'error', message: error.message || 'Ocorreu um erro inesperado.' });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Editar Paciente' : 'Cadastro de Novo Paciente'}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Preencha os campos abaixo para {isEditing ? 'atualizar os dados do' : 'cadastrar um novo'} paciente.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="p-6 space-y-6">
          {/* Seção de Dados Pessoais */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome Completo */}
              <div className="md:col-span-2">
                <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  name="nome_completo"
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  placeholder="Digite o nome completo"
                  className={`form-input ${errors.nome_completo ? 'input-error' : ''}`}
                />
                {errors.nome_completo && <p className="form-error-message">{errors.nome_completo}</p>}
              </div>
              {/* CPF */}
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF *</label>
                <input
                  type="text"
                  name="cpf"
                  id="cpf"
                  value={formData.cpf} // O valor já está formatado no estado
                  onChange={handleChange}
                  disabled={isEditing}
                  maxLength={14}
                  placeholder="000.000.000-00"
                  className={`form-input ${errors.cpf ? 'input-error' : ''} ${isEditing ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
                />
                {errors.cpf && <p className="form-error-message">{errors.cpf}</p>}
              </div>
              {/* Data de Nascimento */}
              <div>
                <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento *</label>
                <input
                  type="date"
                  name="data_nascimento"
                  id="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleChange}
                  className={`form-input ${errors.data_nascimento ? 'input-error' : ''}`}
                />
                {errors.data_nascimento && <p className="form-error-message">{errors.data_nascimento}</p>}
              </div>
            </div>
          </div>

          {/* Seção de Informações Adicionais */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sexo */}
              <div>
                <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo</label>
                <select
                  name="sexo"
                  id="sexo"
                  value={formData.sexo}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contato@email.com"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                />
                {errors.email && <p className="form-error-message">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Mensagem de Status */}
          {formStatus && (
            <div className={`flex items-center gap-3 p-3 rounded-md text-sm ${
              formStatus.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200'
            }`}>
              {/* Ícone de Sucesso ou Erro */}
              {formStatus.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              )}
              <span>{formStatus.message}</span>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-4 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Cadastrar Paciente')}
          </button>
        </div>
      </form>
    </div>
  );
}
