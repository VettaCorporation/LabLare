'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowUturnLeftIcon, UserCircleIcon, BeakerIcon } from '@heroicons/react/24/outline';
import ExameSelection from '@/components/ExameSelection/ExameSelection';

// --- Interfaces ---
interface Paciente {
    id_paciente: number;
    nome_completo: string;
    cpf: string;
}

// AQUI ESTÁ A CORREÇÃO: A interface agora é idêntica à do ExameSelection.tsx
interface Exame {
    id_exame_catalogo: number;
    nome_exame: string;
    preco: number;
    codigo_lare?: string | null;
    codigo_pardini?: string | null;
    origem: string; // <-- Campo 'origem' agora é obrigatório
}

interface SolicitacaoExameFormProps {
    paciente: Paciente;
    onClearSelection: () => void;
}

export default function SolicitacaoExameForm({ paciente, onClearSelection }: SolicitacaoExameFormProps) {
    const router = useRouter();
    const [medicoSolicitante, setMedicoSolicitante] = useState('');
    const [examesSelecionados, setExamesSelecionados] = useState<Exame[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (examesSelecionados.length === 0) {
            toast.error('Selecione pelo menos um exame.');
            return;
        }
        setLoading(true);
        
        const payload = {
            id_paciente: paciente.id_paciente,
            examesSelecionados: examesSelecionados.map(ex => ({ id_exame_catalogo: ex.id_exame_catalogo })),
            medico_solicitante: medicoSolicitante,
        };

        try {
            const response = await fetch('/api/solicitacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha ao criar a solicitação.');
            }
            
            toast.success(data.message);
            router.push('/dashboard/pedidos');

        } catch (error: any)
{
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nova Solicitação de Exame</h2>
                    <p className="text-gray-600 dark:text-gray-400">Paciente: <span className="font-semibold">{paciente.nome_completo}</span></p>
                </div>
                <button
                    type="button"
                    onClick={onClearSelection}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                    Trocar Paciente
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <UserCircleIcon className="h-7 w-7 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Dados da Solicitação</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="paciente" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paciente</label>
                        <input
                            type="text"
                            id="paciente"
                            value={paciente.nome_completo}
                            disabled
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        />
                    </div>
                    <div>
                        <label htmlFor="medico" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Médico Solicitante (Opcional)</label>
                        <input
                            type="text"
                            id="medico"
                            value={medicoSolicitante}
                            onChange={(e) => setMedicoSolicitante(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <BeakerIcon className="h-7 w-7 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Exames</h3>
                </div>
                <ExameSelection
                    onExamesSelected={setExamesSelecionados}
                    selectedExams={examesSelecionados}
                />
            </div>
            
            <div className="p-4 flex justify-end">
                <button
                    type="submit"
                    disabled={loading || examesSelecionados.length === 0}
                    className="px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 shadow-lg"
                >
                    {loading ? 'Enviando...' : 'Finalizar Solicitação'}
                </button>
            </div>
        </form>
    );
}