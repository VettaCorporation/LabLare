// lablare/src/app/dashboard/atendimento/page.jsx (VERSÃO COMPLETA)
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PacienteCadastroForm from '../../../components/PacienteCadastroForm/PacienteCadastroForm';
import ExameSelection from '../../../components/ExameSelection/ExameSelection';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');

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
  
  const [showCadastro, setShowCadastro] = useState(initialAction === 'add');

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
      const response = await fetch(`/api/pacientes?nome=${encodeURIComponent(termo)}`);
      if (!response.ok) throw new Error('Erro ao buscar pacientes');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Falha na busca:', error);
      setSearchResults([]);
      setSolicitacaoMessage('Erro ao buscar pacientes.');
    }
  }, 300), []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowCadastro(false);
    fetchPacientes(value);
  };

  const handlePacienteSelect = (paciente) => {
    setSelectedPaciente(paciente);
    setSearchTerm(paciente.nome_completo);
    setSearchResults([]);
    resetSolicitacaoAndFaturamentoStates();
  };

  const handleNewPatientSaved = (apiResponse) => {
    const newPatient = apiResponse.paciente || apiResponse;
    setSelectedPaciente(newPatient);
    setSearchTerm(newPatient.nome_completo);
    setShowCadastro(false);
    setSolicitacaoMessage('Novo paciente cadastrado e selecionado!');
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
      setSolicitacaoMessage('Você não tem permissão para registrar solicitações.');
      return;
    }
    if (!selectedPaciente) {
      setSolicitacaoMessage('Por favor, selecione um paciente.');
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
      setSolicitacaoMessage('ID de usuário inválido. Tente fazer login novamente.');
      return;
    }

    try {
      const response = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setSolicitacaoMessage(data.message || 'Solicitação registrada com sucesso!');
        setCurrentSolicitacaoId(data.solicitacao.id_solicitacao);
      } else {
        setSolicitacaoMessage(data.message || 'Erro ao registrar solicitação.');
      }
    } catch (apiError) {
      setSolicitacaoMessage('Ocorreu um erro inesperado.');
    }
  };

  const handleRegisterPagamento = async () => {
    setFaturamentoMessage('');
    if (!currentSolicitacaoId) {
      setFaturamentoMessage('Nenhuma solicitação ativa para faturar.');
      return;
    }
    if (!tipoAtendimento) {
      setFaturamentoMessage('Selecione o tipo de atendimento.');
      return;
    }
    if (tipoAtendimento === 'PARTICULAR' && !formaPagamento) {
      setFaturamentoMessage('Selecione a forma de pagamento.');
      return;
    }

    const idUsuarioPagador = Number(session?.user?.id);
    if (isNaN(idUsuarioPagador) || idUsuarioPagador <= 0) {
      setFaturamentoMessage('ID de usuário inválido.');
      return;
    }

    try {
      const response = await fetch('/api/faturamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setFaturamentoMessage(data.message || 'Erro ao registrar pagamento.');
      }
    } catch (apiError) {
      setFaturamentoMessage('Ocorreu um erro inesperado.');
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

  useEffect(() => {
    if (initialAction === 'add') {
      setSelectedPaciente(null);
      setSearchTerm('');
      setSearchResults([]);
      setShowCadastro(true);
    } else {
      setShowCadastro(false);
    }
  }, [initialAction]);

  if (status === 'loading') {
    return <div className="p-8">Carregando...</div>;
  }
  if (status === 'unauthenticated') {
    return <div className="p-8 text-red-600">Acesso negado. Por favor, faça login.</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Atendimento ao Paciente</h1>

      {!selectedPaciente && (
        showCadastro ? (
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <PacienteCadastroForm 
              onPatientSaved={handleNewPatientSaved} 
              onCancel={() => router.push('/dashboard/pacientes')}
            />
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-2xl font-semibold mb-4">Busca Rápida de Paciente</h2>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Digite o nome ou CPF do paciente"
                className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700"
              />
              {searchResults.length > 0 && (
                <ul className="border mt-2 rounded">
                  {searchResults.map((paciente) => (
                    <li key={paciente.id_paciente} onClick={() => handlePacienteSelect(paciente)}
                      className="px-4 py-2 border-b cursor-pointer hover:bg-blue-50">
                      <strong>{paciente.nome_completo}</strong> (CPF: {paciente.cpf})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {(searchTerm.length >= 3 && searchResults.length === 0) && (
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <p className="text-center mb-4">Nenhum paciente encontrado. Cadastre um novo abaixo.</p>
                    <PacienteCadastroForm 
                        onPatientSaved={handleNewPatientSaved} 
                        onCancel={() => setSearchTerm('')}
                    />
                </div>
            )}
          </>
        )
      )}

      {selectedPaciente && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-2xl font-semibold mb-4">Paciente Ativo: <span className="text-blue-700">{selectedPaciente.nome_completo}</span></h2>
          <button
            onClick={() => {
              setSelectedPaciente(null);
              setSearchTerm('');
              resetSolicitacaoAndFaturamentoStates();
            }}
            className="mb-6 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md"
          >
            Trocar Paciente
          </button>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
            <h3 className="text-2xl font-semibold mb-4">Registrar Solicitação de Exames</h3>
            <ExameSelection onExamesSelected={handleExamesSelected} initialSelectedExames={examesSelecionados} />
            
            {/* --- CÓDIGO RESTAURADO A PARTIR DAQUI --- */}
            <div className="mt-6">
              <label htmlFor="medicoSolicitante" className="block text-sm font-bold mb-2">
                Médico Solicitante:
              </label>
              <input
                type="text"
                id="medicoSolicitante"
                value={medicoSolicitante}
                onChange={(e) => setMedicoSolicitante(e.target.value)}
                className="shadow-sm appearance-none border rounded w-full py-2 px-3"
                placeholder="Nome do médico ou CRM"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="observacoesMedicas" className="block text-sm font-bold mb-2">
                Observações Médicas:
              </label>
              <textarea
                id="observacoesMedicas"
                value={observacoesMedicas}
                onChange={(e) => setObservacoesMedicas(e.target.value)}
                rows={3}
                className="shadow-sm appearance-none border rounded w-full py-2 px-3"
                placeholder="Informações adicionais"
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
              className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
            >
              {currentSolicitacaoId ? 'Solicitação Registrada' : 'Gerar Orçamento'}
            </button>
            
            {currentSolicitacaoId && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-2xl font-semibold mb-4 text-blue-800">Faturamento e Pagamento</h3>
                <div className="mb-4">
                  <p className="text-lg font-bold">Solicitação ID: {currentSolicitacaoId}</p>
                  <p className="text-xl font-extrabold text-green-700">
                    Valor Total: {valorTotalExames.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Tipo de Atendimento:</label>
                  <div className="flex gap-4">
                    <label><input type="radio" name="tipoAtendimento" value="CONVENIO" checked={tipoAtendimento === 'CONVENIO'} onChange={(e) => { setTipoAtendimento(e.target.value); setFormaPagamento(''); }} /> Convênio</label>
                    <label><input type="radio" name="tipoAtendimento" value="PARTICULAR" checked={tipoAtendimento === 'PARTICULAR'} onChange={(e) => setTipoAtendimento(e.target.value)} /> Particular</label>
                  </div>
                </div>

                {tipoAtendimento === 'PARTICULAR' && (
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Forma de Pagamento:</label>
                    <div className="flex gap-4">
                      <label><input type="radio" name="formaPagamento" value="CARTAO" checked={formaPagamento === 'CARTAO'} onChange={(e) => setFormaPagamento(e.target.value)} /> Cartão</label>
                      <label><input type="radio" name="formaPagamento" value="PIX" checked={formaPagamento === 'PIX'} onChange={(e) => setFormaPagamento(e.target.value)} /> Pix</label>
                      <label><input type="radio" name="formaPagamento" value="ESPECIE" checked={formaPagamento === 'ESPECIE'} onChange={(e) => setFormaPagamento(e.target.value)} /> Espécie</label>
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
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {pagamentoConfirmado ? 'Pagamento Confirmado' : 'Confirmar Pagamento'}
                </button>

                {pagamentoConfirmado && (
                  <button type="button" className="ml-4 mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md">
                    Gerar Recibo
                  </button>
                )}
              </div>
            )}
            {/* --- FIM DO CÓDIGO RESTAURADO --- */}
          </div>
        </div>
      )}
    </div>
  );
}