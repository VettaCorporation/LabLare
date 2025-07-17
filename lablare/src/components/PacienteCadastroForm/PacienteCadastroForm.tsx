// src/components/PacienteCadastroForm/PacienteCadastroForm.tsx
'use client';

import React, { useState } from 'react';
import { isValidCPF } from '@/utils/cpfValidator';

interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo?: string;
  email?: string; 
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
    email: '', 
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); 

  const applyCpfMask = (value: string) => {
    const numericValue = value.replace(/\D/g, ''); 
    if (numericValue.length <= 3) return numericValue;
    if (numericValue.length <= 6) return `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`;
    if (numericValue.length <= 9) return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6)}`;
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6, 9)}-${numericValue.slice(9, 11)}`;
  };

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
    
    if (!formData.sexo) { 
      newErrors.sexo = 'Sexo é obrigatório.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenericChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setMessage('');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); 
    setFormData((prev) => ({ ...prev, cpf: rawValue.slice(0, 11) })); 
    
    if (errors.cpf) {
      setErrors((prev) => ({ ...prev, cpf: '' }));
    }
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    setMessage(''); 

    if (!validateForm()) {
      setMessage('Por favor, corrija os erros no formulário.');
      setLoading(false); 
      return;
    }

    try {
      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao cadastrar paciente.');
      }
      
      setMessage('Paciente cadastrado com sucesso!');
      
      setTimeout(() => {
        onPatientSaved(result); 
      }, 1500);

    } catch (error: any) {
      setMessage(error.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Cadastrar Novo Paciente</h2>
      {message && (
        <div className={`mt-4 text-sm p-3 rounded ${message.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700">Nome Completo *</label>
            <input type="text" name="nome_completo" id="nome_completo" value={formData.nome_completo} onChange={handleGenericChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
            {errors.nome_completo && <p className="text-red-500 text-xs mt-1">{errors.nome_completo}</p>}
          </div>

          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF *</label>
            <input 
              type="text" 
              name="cpf" 
              id="cpf" 
              value={applyCpfMask(formData.cpf)} 
              onChange={handleCpfChange} 
              maxLength={14} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
              placeholder="000.000.000-00"
              required
            />
            {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
          </div>

          <div>
            <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700">Data de Nascimento *</label>
            <input type="date" name="data_nascimento" id="data_nascimento" value={formData.data_nascimento} onChange={handleGenericChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
            {errors.data_nascimento && <p className="text-red-500 text-xs mt-1">{errors.data_nascimento}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">Sexo *</label>
            <select name="sexo" id="sexo" value={formData.sexo} onChange={handleGenericChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
              <option value="">Selecione...</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
            {errors.sexo && <p className="text-red-500 text-xs mt-1">{errors.sexo}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Opcional)</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleGenericChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading} 
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading} 
          >
            {loading ? 'Cadastrando...' : 'Salvar Paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}
