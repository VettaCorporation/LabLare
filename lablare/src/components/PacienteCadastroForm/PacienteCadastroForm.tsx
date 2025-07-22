// src/components/PacienteCadastroForm/PacienteCadastroForm.tsx (COM onCHANGE CORRIGIDO)
'use client';

import React, { useState, useEffect } from 'react';
import { isValidCPF } from '@/utils/cpfValidator';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';

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

export default function PacienteCadastroForm({ onPatientSaved, onCancel, initialData }: PacienteCadastroFormProps) {
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

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome_completo: initialData.nome_completo,
        cpf: initialData.cpf,
        data_nascimento: new Date(initialData.data_nascimento).toISOString().split('T')[0],
        sexo: initialData.sexo || '',
        email: initialData.email || '',
      });
    }
  }, [initialData]);

  const isEditing = !!initialData;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nome_completo.trim()) newErrors.nome_completo = 'Nome completo é obrigatório.';
    if (!isEditing && !isValidCPF(formData.cpf)) newErrors.cpf = 'Por favor, insira um CPF válido.';
    if (!formData.data_nascimento) newErrors.data_nascimento = 'Data de nascimento é obrigatória.';
    if (!formData.sexo) newErrors.sexo = 'Sexo é obrigatório.';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Formato de email inválido.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ### FUNÇÃO ADICIONADA DE VOLTA ###
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove qualquer formatação (pontos, traços) para guardar apenas os números
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, cpf: rawValue.slice(0, 11) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const url = isEditing ? `/api/pacientes/${initialData.id_paciente}` : '/api/pacientes';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        // No modo de edição, enviamos todos os dados exceto o CPF.
        // No modo de adição, enviamos tudo.
        body: JSON.stringify(isEditing ? { 
            nome_completo: formData.nome_completo,
            data_nascimento: formData.data_nascimento,
            sexo: formData.sexo,
            email: formData.email,
        } : formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Erro ao salvar paciente.');
      
      setMessage(`Paciente ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`);
      setTimeout(() => onPatientSaved(result), 1500);

    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderOriginalValue = (fieldName: keyof typeof formData) => {
    if (isEditing && initialData && formData[fieldName] !== (fieldName === 'data_nascimento' ? new Date(initialData[fieldName]).toISOString().split('T')[0] : initialData[fieldName])) {
      const originalValue = fieldName === 'data_nascimento' ? new Date(initialData[fieldName]).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : initialData[fieldName];
      return (
        <p className="text-xs text-gray-500 mt-1">
          <span className="font-semibold">Original:</span> {originalValue}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {isEditing ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
      </h2>
      {message && <div className={`mb-4 text-sm p-3 rounded ${message.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700">Nome Completo *</label>
            <input type="text" name="nome_completo" value={formData.nome_completo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            {renderOriginalValue('nome_completo')}
          </div>
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF *</label>
            {/* ### onCHANGE ADICIONADO AQUI ### */}
            <input 
              type="text" 
              name="cpf" 
              value={formatCpfForDisplay(formData.cpf)} 
              onChange={handleCpfChange}
              disabled={isEditing} 
              maxLength={14}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${isEditing ? 'bg-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
            />
          </div>
          <div>
            <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700">Data de Nascimento *</label>
            <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            {renderOriginalValue('data_nascimento')}
          </div>
          <div>
            <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">Sexo *</label>
            <select name="sexo" value={formData.sexo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <option value="">Selecione...</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
            {renderOriginalValue('sexo')}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            {renderOriginalValue('email')}
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end gap-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}