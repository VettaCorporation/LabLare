'use client';

import React, { useState } from 'react';
// Importe a função de validação de CPF do seu arquivo de utilitários
import { isValidCPF } from '@/utils/cpfValidator';

// Interfaces para tipagem do componente
interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo?: string;
}

interface PacienteCadastroFormProps {
  onPatientSaved: (patient: Paciente) => void;
  onCancel: () => void;
}

export default function PacienteCadastroForm({ onPatientSaved, onCancel }: PacienteCadastroFormProps) {
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    data_nascimento: '',
    sexo: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState('');

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório.';
    }

    if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = 'Por favor, insira um CPF válido.';
    }

    if (!formData.data_nascimento) {
      newErrors.data_nascimento = 'Data de nascimento é obrigatória.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenericChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpa o erro ao digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setMessage('');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value;

    // Aplica a máscara de formatação
    valor = valor.replace(/\D/g, ''); // Remove caracteres não numéricos
    valor = valor.substring(0, 11);   // Limita a 11 dígitos

    if (valor.length > 9) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (valor.length > 3) {
      valor = valor.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    // Atualiza o estado
    setFormData((prev) => ({ ...prev, cpf: valor }));
    
    if (errors.cpf) {
      setErrors((prev) => ({ ...prev, cpf: '' }));
    }
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage('Por favor, corrija os erros no formulário.');
      return;
    }

    try {
      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Envia o CPF limpo para a API
          cpf: formData.cpf.replace(/\D/g, ''),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao cadastrar paciente.');
      }
      
      setMessage('Paciente cadastrado com sucesso!');
      
      // Adiciona um pequeno atraso para o usuário ver a mensagem
      setTimeout(() => {
        onPatientSaved(result); // Chama o callback de sucesso para fechar o form
      }, 1500);

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      setMessage(error.message || 'Ocorreu um erro inesperado.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Cadastrar Novo Paciente</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input type="text" name="nome_completo" id="nome_completo" value={formData.nome_completo} onChange={handleGenericChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            {errors.nome_completo && <p className="text-red-500 text-xs mt-1">{errors.nome_completo}</p>}
          </div>

          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
            <input type="text" name="cpf" id="cpf" value={formData.cpf} onChange={handleCpfChange} maxLength={14} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="000.000.000-00"/>
            {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
          </div>

          <div>
            <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
            <input type="date" name="data_nascimento" id="data_nascimento" value={formData.data_nascimento} onChange={handleGenericChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            {errors.data_nascimento && <p className="text-red-500 text-xs mt-1">{errors.data_nascimento}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">Sexo</label>
            <select name="sexo" id="sexo" value={formData.sexo} onChange={handleGenericChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">Selecione...</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>

        {message && <div className={`mt-4 text-sm ${message.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>{message}</div>}

        <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end gap-4">
          <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
            Salvar Paciente
          </button>
        </div>
      </form>
    </div>
  );
}