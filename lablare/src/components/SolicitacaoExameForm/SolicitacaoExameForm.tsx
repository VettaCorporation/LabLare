// Caminho: src/components/SolicitacaoExameForm/SolicitacaoExameForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import ExameSelection from '@/components/ExameSelection/ExameSelection';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

// --- INTERFACE CORRIGIDA ---
// Adicionamos 'nome_completo' que estava faltando.
interface Paciente {
    id_paciente: number;
    nome_completo: string;
}

interface Exame {
    id_exame_catalogo: number;
    nome_exame: string;
    preco: number;
}

interface SolicitacaoExameFormProps {
    paciente: Paciente;
    onClearSelection: () => void;
}

export default function SolicitacaoExameForm({ paciente, onClearSelection }: SolicitacaoExameFormProps) {
    const router = useRouter();
    const [medicoSolicitante, setMedicoSolicitante] = useState('');
    const [examesSelecionados, setExamesSelecionados] = useState<Exame[]>([]);
    const [valorTotal, setValorTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const total = examesSelecionados.reduce((acc, exame) => acc + Number(exame.preco), 0);
        setValorTotal(total);
    }, [examesSelecionados]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (examesSelecionados.length === 0) {
            toast.error('Selecione pelo menos um exame.');
            return;
        }
        setLoading(true);

        const solicitacaoData = {
            id_paciente: paciente.id_paciente,
            medico_solicitante: medicoSolicitante,
            exames: examesSelecionados.map(ex => ex.id_exame_catalogo),
        };

        try {
            const response = await fetch('/api/solicitacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(solicitacaoData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao criar a solicitação.');
            }
            
            toast.success('Solicitação criada com sucesso!');
            router.push('/dashboard/pacientes');

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Informações da Solicitação</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="paciente" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paciente</label>
                        <input
                            type="text"
                            id="paciente"
                            value={paciente.nome_completo}
                            disabled
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        />
                    </div>
                    <div>
                        <label htmlFor="medico" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Médico Solicitante (Opcional)</label>
                        <input
                            type="text"
                            id="medico"
                            value={medicoSolicitante}
                            onChange={(e) => setMedicoSolicitante(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                </div>
            </div>

            <ExameSelection
                examesSelecionados={examesSelecionados}
                setExamesSelecionados={setExamesSelecionados}
            />

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex justify-between items-center">
                <div>
                    <span className="text-lg font-medium text-gray-600 dark:text-gray-300">Valor Total:</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white ml-2">
                        {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={onClearSelection}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        <ArrowUturnLeftIcon className="h-5 w-5" />
                        Voltar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || examesSelecionados.length === 0}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processando...' : 'Finalizar Solicitação'}
                    </button>
                </div>
            </div>
        </form>
    );
}