"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import PacienteCadastroForm from '../../components/PacienteCadastroForm'; 

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export default function AtendimentoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const fetchPacientes = useCallback(debounce(async (nome) => {
    if (nome.length < 3) { 
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`/api/pacientes/search?nome=${encodeURIComponent(nome)}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar pacientes');
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Falha na busca:', error);
      setSearchResults([]);
    }
  }, 300), []); 

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchPacientes(value);
  };

  const handlePacienteSelect = (paciente) => {
    setSelectedPaciente(paciente);
    setSearchTerm(paciente.nome_completo); 
    setSearchResults([]); 
    console.log('Paciente selecionado para atendimento/edição:', paciente);
  };

  const handleNewPatientSaved = (newPatient) => {
    setSelectedPaciente(newPatient); 
    setSearchTerm(newPatient.nome_completo);
    alert('Novo paciente cadastrado e selecionado para atendimento!');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Atendimento ao Paciente</h1>

      {/* Seção de Busca Rápida de Paciente */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h2>Busca Rápida de Paciente</h2>
        <label htmlFor="searchPaciente" style={{ display: 'block', marginBottom: '5px' }}>Buscar Paciente por Nome Completo ou CPF:</label>
        <input
          type="text"
          id="searchPaciente"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Digite o nome ou CPF do paciente"
          style={{ width: 'calc(100% - 16px)', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        {searchResults.length > 0 && searchTerm.length >= 3 && (
          <ul style={{ border: '1px solid #ccc', listStyle: 'none', padding: '0', margin: '5px 0', maxHeight: '200px', overflowY: 'auto', backgroundColor: 'white', borderRadius: '4px' }}>
            {searchResults.map((paciente) => (
              <li
                key={paciente.id_paciente}
                onClick={() => handlePacienteSelect(paciente)}
                style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  <strong>{paciente.nome_completo}</strong> <br />
                  CPF: {paciente.cpf} | Nasc.: {new Date(paciente.data_nascimento).toLocaleDateString()}
                </span>
                <button style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Selecionar</button>
              </li>
            ))}
          </ul>
        )}
        {searchTerm.length >= 3 && searchResults.length === 0 && !selectedPaciente && (
            <p style={{ color: '#666', fontSize: '0.9em', marginTop: '10px' }}>Nenhum paciente encontrado com este termo. Considere cadastrar um novo.</p>
        )}
      </div>

      {/* Informações do Paciente Selecionado / Cadastro de Novo Paciente */}
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        {selectedPaciente ? (
          <div>
            <h2>Paciente Ativo: {selectedPaciente.nome_completo}</h2>
            <p><strong>ID:</strong> {selectedPaciente.id_paciente}</p>
            <p><strong>CPF:</strong> {selectedPaciente.cpf}</p>
            <p><strong>Data de Nascimento:</strong> {new Date(selectedPaciente.data_nascimento).toLocaleDateString()}</p>
            <p><strong>Sexo:</strong> {selectedPaciente.sexo || 'Não informado'}</p>
            <button onClick={() => {
              setSelectedPaciente(null);
              setSearchTerm('');
              setSearchResults([]);
            }} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
              Trocar Paciente
            </button>
            {/* botão iniciar solicitação de exames */}
            <button style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Prosseguir para Solicitação de Exames
            </button>
          </div>
        ) : (
          <div>
            <h2>Cadastrar Novo Paciente</h2>
            <PacienteCadastroForm onPatientSaved={handleNewPatientSaved} />
          </div>
        )}
      </div>
    </div>
  );
}