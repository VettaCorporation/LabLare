'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ExameSelection from '@/components/ExameSelection/ExameSelection';

// Tipos para os dados que vamos manipular
interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
}

interface Exame {
  id_exame_catalogo: number;
  nome_exame: string;
  preco: number;
  origem: string; // Adicionado para corresponder à interface Exame em SolicitacaoExameForm.tsx
}

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export default function NovoOrcamentoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados do formulário
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Paciente[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [examesSelecionados, setExamesSelecionados] = useState<Exame[]>([]);
  const [desconto, setDesconto] = useState('0');
  const [validadeDias, setValidadeDias] = useState('15');

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // Busca de pacientes com debounce para não sobrecarregar a API
  const fetchPacientes = useCallback(debounce(async (termo: string) => {
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
    }
  }, 300), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedPaciente(null); // Limpa o paciente selecionado ao digitar
    fetchPacientes(value);
  };
  
  const handlePacienteSelect = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setSearchTerm(paciente.nome_completo);
    setSearchResults([]);
  };
  
  // Cálculos automáticos dos valores
  const { valorBruto, valorDesconto, valorFinal } = useMemo(() => {
    const bruto = examesSelecionados.reduce((sum, exame) => sum + Number(exame.preco), 0);
    const desc = Number(desconto) || 0;
    const final = bruto - desc;
    return {
      valorBruto: bruto,
      valorDesconto: desc,
      valorFinal: final < 0 ? 0 : final,
    };
  }, [examesSelecionados, desconto]);

  // Função para enviar o orçamento para a API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaciente || examesSelecionados.length === 0) {
      setMessage('É necessário selecionar um paciente e ao menos um exame.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_paciente: selectedPaciente.id_paciente,
          exames: examesSelecionados.map(ex => ({ id_exame_catalogo: ex.id_exame_catalogo, preco: ex.preco })),
          desconto: valorDesconto,
          validadeDias: Number(validadeDias),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      router.push('/dashboard/orcamento?success=true');

    } catch (err: any) {
      setMessage(err.message || 'Ocorreu um erro ao salvar o orçamento.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading') return <div className="p-8 dark:text-gray-300">Carregando...</div>;
  if (status === 'unauthenticated') { router.push('/login'); return null; }

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Criar Novo Orçamento</h1>
        <Link href="/dashboard/solicitar-exame" className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer">
          Voltar para a Lista
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Seção do Paciente */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">1. Paciente</h2>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Digite o nome ou CPF para buscar..."
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          />
          {searchResults.length > 0 && (
            <ul className="border dark:border-gray-700 mt-2 rounded-md max-h-40 overflow-y-auto">
              {searchResults.map((p) => (
                <li key={p.id_paciente} onClick={() => handlePacienteSelect(p)}
                  className="p-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/50 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {p.nome_completo} - CPF: {p.cpf}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Seção de Exames */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">2. Exames</h2>
            <ExameSelection
                selectedExams={examesSelecionados} // Pass the state as a prop
                onExamesSelected={setExamesSelecionados}
            />
        </div>

        {/* Seção de Valores e Validade */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">3. Detalhes e Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="desconto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Desconto (R$)</label>
                    <input type="number" id="desconto" value={desconto} onChange={(e) => setDesconto(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                        placeholder="0.00" step="0.01"
                    />
                </div>
                 <div>
                    <label htmlFor="validade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Validade do Orçamento (dias)</label>
                    <input type="number" id="validade" value={validadeDias} onChange={(e) => setValidadeDias(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                    />
                </div>
            </div>
            <div className="mt-6 border-t dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400"><p>Subtotal:</p> <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorBruto)}</p></div>
                <div className="flex justify-between text-red-600 dark:text-red-500"><p>Desconto:</p> <p>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorDesconto)}</p></div>
                <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-gray-100"><p>Valor Total:</p> <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorFinal)}</p></div>
            </div>
        </div>

        {message && (
          <div className={`p-4 rounded-md text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="flex justify-end">
            <button type="submit" disabled={loading}
             className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md disabled:opacity-50 cursor-pointer"
            >
                {loading ? 'Salvando...' : 'Salvar Orçamento'}
            </button>
        </div>
      </form>
    </div>
  );
}