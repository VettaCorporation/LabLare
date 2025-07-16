"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PacienteCadastroForm from '../../components/PacienteCadastroForm/PacienteCadastroForm';
import ExameSelection from '../../components/ExameSelection/ExameSelection';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);

  const [medicoSolicitante, setMedicoSolicitante] = useState('');
  const [observacoesMedicas, setObservacoesMedicas] = useState('');
  const [examesSelecionados, setExamesSelecionados] = useState([]);
  const [solicitacaoMessage, setSolicitacaoMessage] = useState('');
  const [currentSolicitacaoId, setCurrentSolicitacaoId] = useState(null); 

  const [tipoAtendimento, setTipoAtendimento] = useState(''); 
  const [formaPagamento, setFormaPagamento] = useState(''); 
  const [faturamentoMessage, setFaturamentoMessage] = useState('');
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false); 

  const canRegisterSolicitacao = session?.user?.nome_perfil === 'Recepcionista' ||
                                 session?.user?.nome_perfil === 'Administrador';

  const valorTotalExames = useMemo(() => {
    return examesSelecionados.reduce((sum, exame) => sum + parseFloat(exame.preco), 0);
  }, [examesSelecionados]);

  const fetchPacientes = useCallback(debounce(async (termo) => {
    if (termo.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const cleanCpf = termo.replace(/\D/g, '');
      const isCpf = cleanCpf.length === 11;
      const queryParam = isCpf ? `cpf=${encodeURIComponent(cleanCpf)}` : `nome=${encodeURIComponent(termo)}`;

      const response = await fetch(`/api/pacientes/search?${queryParam}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar pacientes');
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Falha na busca:', error);
      setSearchResults([]);
      setSolicitacaoMessage('Erro ao buscar pacientes. Verifique sua conexão.');
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
    resetSolicitacaoAndFaturamentoStates(); 
  };

  const handleNewPatientSaved = (newPatient) => {
    setSelectedPaciente(newPatient);
    setSearchTerm(newPatient.nome_completo);
    setSolicitacaoMessage('Novo paciente cadastrado e selecionado para atendimento!');
    resetSolicitacaoAndFaturamentoStates(); 
  };

  const handleExamesSelected = useCallback((exames) => {
    setExamesSelecionados(exames);
  }, []);

  const handleRegisterSolicitacao = async () => {
    setSolicitacaoMessage('');
    setFaturamentoMessage(''); 
    setPagamentoConfirmado(false); 

    if (status !== 'authenticated' || !canRegisterSolicitacao) {
      setSolicitacaoMessage('Você não tem permissão para registrar solicitações. Faça login com um perfil autorizado.');
      return;
    }

    if (!selectedPaciente) {
      setSolicitacaoMessage('Por favor, selecione ou cadastre um paciente primeiro.');
      return;
    }
    if (examesSelecionados.length === 0) {
      setSolicitacaoMessage('Por favor, selecione pelo menos um exame.');
      return;
    }
    if (!medicoSolicitante.trim()) {
      setSolicitacaoMessage('O campo "Médico Solicitante" é obrigatório.');
      return;
    }

    const idUsuarioSolicitante = Number(session?.user?.id);

    if (isNaN(idUsuarioSolicitante) || idUsuarioSolicitante <= 0) {
      setSolicitacaoMessage('Não foi possível obter o ID do usuário logado. Tente fazer login novamente.');
      console.error('ID do usuário logado inválido:', session?.user?.id);
      return;
    }

    try {
      const response = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_paciente: selectedPaciente.id_paciente,
          id_usuario_solicitante: idUsuarioSolicitante,
          examesSelecionados: examesSelecionados.map(exame => ({ id_exame_catalogo: exame.id_exame_catalogo })),
          medico_solicitante: medicoSolicitante,
          observacoes_medicas: observacoesMedicas,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSolicitacaoMessage(data.message || 'Solicitação registrada com sucesso! Prossiga para o faturamento.');
        setCurrentSolicitacaoId(data.solicitacao.id_solicitacao); 
      } else {
        setSolicitacaoMessage(data.message || data.error || 'Erro ao registrar solicitação. Tente novamente.');
      }
    } catch (apiError) {
      console.error('Erro na requisição de solicitação:', apiError);
      setSolicitacaoMessage('Ocorreu um erro inesperado ao registrar a solicitação.');
    }
  };

  const handleRegisterPagamento = async () => {
    setFaturamentoMessage('');

    if (!currentSolicitacaoId) {
      setFaturamentoMessage('Nenhuma solicitação ativa para faturar.');
      return;
    }
    if (!tipoAtendimento) {
      setFaturamentoMessage('Selecione o tipo de atendimento (Convênio/Particular).');
      return;
    }
    if (tipoAtendimento === 'PARTICULAR' && !formaPagamento) {
      setFaturamentoMessage('Selecione a forma de pagamento para atendimento particular.');
      return;
    }

    const idUsuarioPagador = Number(session?.user?.id);
    if (isNaN(idUsuarioPagador) || idUsuarioPagador <= 0) {
      setFaturamentoMessage('Não foi possível obter o ID do usuário logado para o pagamento. Tente fazer login novamente.');
      return;
    }

    try {
      const response = await fetch('/api/faturamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_solicitacao: currentSolicitacaoId,
          tipo_atendimento: tipoAtendimento,
          forma_pagamento: formaPagamento,
          valor_total_informado: valorTotalExames, 
          id_usuario_pagador: idUsuarioPagador,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFaturamentoMessage(data.message || 'Pagamento registrado com sucesso!');
        setPagamentoConfirmado(true); 
      } else {
        setFaturamentoMessage(data.message || data.error || 'Erro ao registrar pagamento. Tente novamente.');
      }
    } catch (apiError) {
      console.error('Erro na requisição de faturamento:', apiError);
      setFaturamentoMessage('Ocorreu um erro inesperado ao registrar o pagamento.');
    }
  };

  const resetSolicitacaoAndFaturamentoStates = () => {
    setMedicoSolicitante('');
    setObservacoesMedicas('');
    setExamesSelecionados([]);
    setSolicitacaoMessage('');
    setCurrentSolicitacaoId(null);
    setTipoAtendimento('');
    setFormaPagamento('');
    setFaturamentoMessage('');
    setPagamentoConfirmado(false);
  };

  if (status === 'loading') {
    return <div className="text-center text-xl mt-10">Carregando informações do usuário...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center text-xl mt-10 p-5 bg-red-100 text-red-700 rounded-md">
        Você precisa estar logado para acessar a página de atendimento. Por favor, faça <Link href="/login" className="text-blue-600 hover:underline">login</Link>.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Atendimento ao Paciente</h1>
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Busca Rápida de Paciente</h2>
        <label htmlFor="searchPaciente" className="block text-gray-700 text-sm font-bold mb-2">
          Buscar Paciente por Nome Completo ou CPF:
        </label>
        <input
          type="text"
          id="searchPaciente"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Digite o nome ou CPF do paciente"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        {searchResults.length > 0 && searchTerm.length >= 3 && (
          <ul className="border border-gray-300 list-none p-0 my-2 max-h-60 overflow-y-auto bg-white rounded-md shadow-sm">
            {searchResults.map((paciente) => (
              <li
                key={paciente.id_paciente}
                onClick={() => handlePacienteSelect(paciente)}
                className="flex justify-between items-center px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-blue-50"
              >
                <span>
                  <strong className="text-blue-700">{paciente.nome_completo}</strong> <br />
                  <span className="text-gray-600 text-sm">CPF: {paciente.cpf} | Nasc.: {new Date(paciente.data_nascimento).toLocaleDateString()}</span>
                </span>
                <button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-md transition duration-150 ease-in-out"
                >
                  Selecionar
                </button>
              </li>
            ))}
          </ul>
        )}
        {searchTerm.length >= 3 && searchResults.length === 0 && !selectedPaciente && (
            <p className="text-gray-600 text-sm mt-2">Nenhum paciente encontrado com este termo. Considere cadastrar um novo.</p>
        )}
      </div>
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
        {selectedPaciente ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Paciente Ativo: <span className="text-blue-700">{selectedPaciente.nome_completo}</span></h2>
            <p className="text-gray-700 mb-2"><strong>ID:</strong> {selectedPaciente.id_paciente}</p>
            <p className="text-gray-700 mb-2"><strong>CPF:</strong> {selectedPaciente.cpf}</p>
            <p className="text-gray-700 mb-2"><strong>Data de Nascimento:</strong> {new Date(selectedPaciente.data_nascimento).toLocaleDateString()}</p>
            <p className="text-gray-700 mb-4"><strong>Sexo:</strong> {selectedPaciente.sexo || 'Não informado'}</p>

            <div className="flex gap-4 mb-8">
              <button
                onClick={() => {
                  setSelectedPaciente(null);
                  setSearchTerm('');
                  setSearchResults([]);
                  resetSolicitacaoAndFaturamentoStates(); 
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out"
              >
                Trocar Paciente
              </button>
            </div>

            {canRegisterSolicitacao ? (
              <>
                <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-2xl font-semibold mb-4 text-gray-700">Registrar Solicitação de Exames</h3>

                  <ExameSelection onExamesSelected={handleExamesSelected} initialSelectedExames={examesSelecionados} />

                  <div className="mt-6">
                    <label htmlFor="medicoSolicitante" className="block text-gray-700 text-sm font-bold mb-2">
                      Médico Solicitante:
                    </label>
                    <input
                      type="text"
                      id="medicoSolicitante"
                      value={medicoSolicitante}
                      onChange={(e) => setMedicoSolicitante(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Nome do médico ou CRM"
                    />
                  </div>
                  <div className="mt-4">
                    <label htmlFor="observacoesMedicas" className="block text-gray-700 text-sm font-bold mb-2">
                      Observações Médicas:
                    </label>
                    <textarea
                      id="observacoesMedicas"
                      value={observacoesMedicas}
                      onChange={(e) => setObservacoesMedicas(e.target.value)}
                      rows="3"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
                      placeholder="Informações adicionais para o laboratório ou médico"
                    ></textarea>
                  </div>
                  {solicitacaoMessage && (
                    <div className={`mt-4 p-3 rounded-md ${solicitacaoMessage.includes('sucesso') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {solicitacaoMessage}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRegisterSolicitacao}
                    disabled={examesSelecionados.length === 0 || !medicoSolicitante.trim() || currentSolicitacaoId !== null} 
                    className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentSolicitacaoId ? 'Solicitação Registrada' : 'Gerar Orçamento (Registrar Solicitação)'}
                  </button>
                </div>

                {currentSolicitacaoId && ( 
                  <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-2xl font-semibold mb-4 text-blue-800">Faturamento e Pagamento</h3>

                    <div className="mb-4 text-gray-800">
                      <p className="text-lg font-bold">Resumo da Solicitação ID: {currentSolicitacaoId}</p>
                      <p className="text-xl font-extrabold text-green-700">
                        Valor Total: {valorTotalExames.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Atendimento:</label>
                      <div className="flex gap-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="tipoAtendimento"
                            value="CONVENIO"
                            checked={tipoAtendimento === 'CONVENIO'}
                            onChange={(e) => { setTipoAtendimento(e.target.value); setFormaPagamento(''); }}
                            className="form-radio text-blue-600 h-4 w-4"
                          />
                          <span className="ml-2 text-gray-700">Convênio</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="tipoAtendimento"
                            value="PARTICULAR"
                            checked={tipoAtendimento === 'PARTICULAR'}
                            onChange={(e) => setTipoAtendimento(e.target.value)}
                            className="form-radio text-blue-600 h-4 w-4"
                          />
                          <span className="ml-2 text-gray-700">Particular</span>
                        </label>
                      </div>
                    </div>

                    {tipoAtendimento === 'PARTICULAR' && (
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Forma de Pagamento:</label>
                        <div className="flex gap-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="formaPagamento"
                              value="CARTAO"
                              checked={formaPagamento === 'CARTAO'}
                              onChange={(e) => setFormaPagamento(e.target.value)}
                              className="form-radio text-blue-600 h-4 w-4"
                            />
                            <span className="ml-2 text-gray-700">Cartão</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="formaPagamento"
                              value="PIX"
                              checked={formaPagamento === 'PIX'}
                              onChange={(e) => setFormaPagamento(e.target.value)}
                              className="form-radio text-blue-600 h-4 w-4"
                            />
                            <span className="ml-2 text-gray-700">Pix</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="formaPagamento"
                              value="ESPECIE"
                              checked={formaPagamento === 'ESPECIE'}
                              onChange={(e) => setFormaPagamento(e.target.value)}
                              className="form-radio text-blue-600 h-4 w-4"
                            />
                            <span className="ml-2 text-gray-700">Espécie</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {faturamentoMessage && (
                      <div className={`mt-4 p-3 rounded-md ${faturamentoMessage.includes('sucesso') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {faturamentoMessage}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleRegisterPagamento}
                      disabled={!tipoAtendimento || (tipoAtendimento === 'PARTICULAR' && !formaPagamento) || pagamentoConfirmado}
                      className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pagamentoConfirmado ? 'Pagamento Confirmado' : 'Confirmar Pagamento'}
                    </button>

                    {pagamentoConfirmado && (
                      <button
                        type="button"
                        className="ml-4 mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
                      >
                        Gerar Recibo
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-8 p-6 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200">
                <p>Você não tem permissão para registrar solicitações. Por favor, faça login com um perfil de Recepcionista ou Administrador.</p>
              </div>
            )}

          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Cadastrar Novo Paciente</h2>
            <PacienteCadastroForm onPatientSaved={handleNewPatientSaved} />
          </div>
        )}
      </div>
    </div>
  );
}
