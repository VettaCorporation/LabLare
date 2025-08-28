// Caminho: src/app/dashboard/solicitar-exame/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SolicitacaoExameForm from '@/components/SolicitacaoExameForm/SolicitacaoExameForm';
import { toast } from 'react-toastify';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';

interface Paciente {
    id_paciente: number;
    nome_completo: string;
    cpf: string;
    data_nascimento: string;
    contato?: string | null;
}

// Componente de busca de paciente com feedback melhorado
function PacienteSearch({ onPacienteSelect }: { onPacienteSelect: (paciente: Paciente) => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Paciente[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm.length >= 3) {
                setHasSearched(true);
                setLoading(true);
                // CORREÇÃO: A chamada da API foi ajustada para buscar por nome ou CPF
                fetch(`/api/pacientes?nome=${encodeURIComponent(searchTerm)}`)
                    .then(res => res.json())
                    .then(data => {
                        setResults(data);
                    })
                    .catch(err => {
                        console.error(err);
                        toast.error("Erro ao buscar pacientes.");
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                setResults([]);
                setHasSearched(false);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const renderTableBody = () => {
        if (loading) {
            return <tr><td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">Buscando...</td></tr>;
        }
        if (results.length > 0) {
            return results.map(paciente => (
                <tr key={paciente.id_paciente}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{paciente.nome_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatCpfForDisplay(paciente.cpf)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{paciente.contato || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => onPacienteSelect(paciente)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">
                            Selecionar
                        </button>
                    </td>
                </tr>
            ));
        }
        if (searchTerm.length > 0 && searchTerm.length < 3) {
            return <tr><td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">Digite pelo menos 3 caracteres para iniciar a busca.</td></tr>;
        }
        if (hasSearched && results.length === 0) {
            return <tr><td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum paciente encontrado.</td></tr>;
        }
        return <tr><td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">Digite no campo acima para buscar um paciente.</td></tr>;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <label htmlFor="search-paciente" className="block text-lg font-medium text-gray-700 dark:text-gray-200">
                Buscar Paciente
            </label>
            <p className="text-sm text-gray-500 mb-4">Digite o nome ou CPF para encontrar o paciente.</p>
            <input
                id="search-paciente"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do paciente..."
                className="w-full max-w-lg p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CPF</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contato</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800">
                        {renderTableBody()}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Componente principal da página (sem alterações)
export default function SolicitarExamePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);

    const fetchPacienteById = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/pacientes/${id}`);
            if (!response.ok) throw new Error('Paciente não encontrado');
            const data = await response.json();
            setPacienteSelecionado(data);
        } catch (error) {
            toast.error('Paciente não encontrado na URL.');
            router.push('/dashboard/solicitar-exame');
        }
    }, [router]);

    useEffect(() => {
        const pacienteId = searchParams.get('pacienteId');
        if (pacienteId) {
            fetchPacienteById(pacienteId);
        }
    }, [searchParams, fetchPacienteById]);

    const handleSelectPaciente = (paciente: Paciente) => {
        setPacienteSelecionado(paciente);
        router.push(`/dashboard/solicitar-exame?pacienteId=${paciente.id_paciente}`);
    };

    const handleClearSelection = () => {
        setPacienteSelecionado(null);
        router.push('/dashboard/solicitar-exame');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                {pacienteSelecionado ? `Solicitação para: ${pacienteSelecionado.nome_completo}` : 'Solicitar Exame'}
            </h1>
            {pacienteSelecionado ? (
                <SolicitacaoExameForm paciente={pacienteSelecionado} onClearSelection={handleClearSelection} />
            ) : (
                <PacienteSearch onPacienteSelect={handleSelectPaciente} />
            )}
        </div>
    );
}
