"use client"; 

import React, { useState } from 'react';

export default function PacienteCadastroForm({ onPatientSaved }) {
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    data_nascimento: '', 
    sexo: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [existingPatientId, setExistingPatientId] = useState(null); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    }
    setMessage('');
    setExistingPatientId(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório.';
    }
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório.';
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) { 
      newErrors.cpf = 'CPF inválido (apenas números, 11 dígitos).';
    }
    if (!formData.data_nascimento) {
      newErrors.data_nascimento = 'Data de nascimento é obrigatória.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCpfBlur = async () => {
    if (!formData.cpf) return;

    const cleanCpf = formData.cpf.replace(/\D/g, ''); 
    if (cleanCpf.length !== 11) return; 

    try {
      const response = await fetch(`/api/pacientes/search?nome=${encodeURIComponent(cleanCpf)}`); 
      const data = await response.json();

      const foundPatient = data.find(p => p.cpf === cleanCpf);

      if (response.ok && foundPatient) {
        setMessage(`CPF já cadastrado para ${foundPatient.nome_completo}.`);
        setExistingPatientId(foundPatient.id_paciente);
      } else {
        setMessage('');
        setExistingPatientId(null);
      }
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      setMessage('Erro ao verificar CPF. Tente novamente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setExistingPatientId(null);

    if (!validateForm()) {
      setMessage('Por favor, corrija os erros no formulário.');
      return;
    }

    try {
      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          cpf: formData.cpf.replace(/\D/g, ''), 
        }),
      });

      if (response.status === 409) { 
        const errorData = await response.json();
        setMessage(errorData.message);
        setExistingPatientId(errorData.pacienteId);
      } else if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar paciente.');
      } else {
        const newPatient = await response.json();
        setMessage('Paciente cadastrado com sucesso!');
        setFormData({ 
          nome_completo: '',
          cpf: '',
          data_nascimento: '',
          sexo: '',
        });
        setErrors({});
        if (onPatientSaved) {
            onPatientSaved(newPatient); 
        }
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setMessage(`Erro no cadastro: ${error.message}`);
    }
  };

  const handleEditExistingPatient = () => {
    if (existingPatientId) {
      alert(`Funcionalidade de edição para paciente ID: ${existingPatientId} a ser implementada.`);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.nome_completo && formData.cpf.replace(/\D/g, '').length === 11 && formData.data_nascimento;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
      <div>
        <label htmlFor="nome_completo">Nome Completo:</label>
        <input
          type="text"
          id="nome_completo"
          name="nome_completo"
          value={formData.nome_completo}
          onChange={handleChange}
          style={{ width: '100%', padding: '8px' }}
        />
        {errors.nome_completo && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.nome_completo}</p>}
      </div>

      <div>
        <label htmlFor="cpf">CPF:</label>
        <input
          type="text"
          id="cpf"
          name="cpf"
          value={formData.cpf}
          onChange={handleChange}
          onBlur={handleCpfBlur} 
          placeholder="Apenas números (11 dígitos)"
          maxLength="11" 
          style={{ width: '100%', padding: '8px' }}
        />
        {errors.cpf && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.cpf}</p>}
      </div>

      <div>
        <label htmlFor="data_nascimento">Data de Nascimento:</label>
        <input
          type="date"
          id="data_nascimento"
          name="data_nascimento"
          value={formData.data_nascimento}
          onChange={handleChange}
          style={{ width: '100%', padding: '8px' }}
        />
        {errors.data_nascimento && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.data_nascimento}</p>}
      </div>

      <div>
        <label htmlFor="sexo">Sexo:</label>
        <select
          id="sexo"
          name="sexo"
          value={formData.sexo}
          onChange={handleChange}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">Selecione</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      {message && <p style={{ color: existingPatientId ? 'orange' : (message.includes('sucesso') ? 'green' : 'red') }}>{message}</p>}
      {existingPatientId && (
        <button type="button" onClick={handleEditExistingPatient} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', marginTop: '5px' }}>
          Editar Paciente Existente
        </button>
      )}

      <button
        type="submit"
        disabled={!isFormValid || !!existingPatientId} 
        style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}
      >
        Salvar Novo Paciente
      </button>
    </form>
  );
}