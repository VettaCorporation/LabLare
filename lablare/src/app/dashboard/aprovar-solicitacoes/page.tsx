'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SolicitacaoStatus } from '@prisma/client';
import { toast } from 'react-toastify';
import { FaEye } from 'react-icons/fa';

interface Solicitacao {
    id_solicitacao: number;
    status: SolicitacaoStatus;
    data_hora_solicitacao: string;
    paciente: { nome_completo: string };
    recepcionista: { nome_completo: string };
    itens_solicitacao: {
        exame_catalogo: {
            nome_exame: string;
        }
    }[];
}

export default function AprovarSolicitacoesPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterId, setFilterId] = useState('');
    const [filterPaciente, setFilterPaciente] = useState('');
    const [filterSolicitante, setFilterSolicitante] = useState('');
    const router = useRouter();

    const fetchSolicitacoes = useCallback(async () => {
        if (sessionStatus !== 'authenticated') return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('status', SolicitacaoStatus.AGUARDANDO_APROVACAO);
            if (filterId) params.append('id', filterId);
            if (filterPaciente) params.append('paciente', filterPaciente);
            if (filterSolicitante) params.append('solicitante', filterSolicitante);
            
            const response = await fetch(`/api/solicitacoes?${params.toString()}`);
            if (!response.ok) throw new Error('Falha ao buscar solicitações.');
            const data: Solicitacao[] = await response.json();
            setSolicitacoes(data);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [sessionStatus, filterId, filterPaciente, filterSolicitante]);

    useEffect(() => {
        fetchSolicitacoes();
    }, [fetchSolicitacoes]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSolicitacoes();
    };

    const handleClearFilters = () => {
        setFilterId('');
        setFilterPaciente('');
        setFilterSolicitante('');
        setTimeout(fetchSolicitacoes, 0); 
    };

    if (loading || sessionStatus === 'loading') {
        return <div className="p-8 text-center">Carregando solicitações...</div>;
    }

    return (
        <div className="flex flex-col md:flex-row p-4 sm:p-6 lg:p-8 space-y-6 md:space-y-0 md:space-x-6">
            <div className="md:w-3/4">
                <h1 className="text-2xl font-bold mb-6">Aprovar Solicitações Pendentes</h1>
                {solicitacoes.length === 0 ? (
                    <p className="text-center text-gray-500">Nenhuma solicitação aguardando aprovação.</p>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exames</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {solicitacoes.map((solicitacao) => (
                                    <tr key={solicitacao.id_solicitacao}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{solicitacao.id_solicitacao}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{solicitacao.paciente.nome_completo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{solicitacao.recepcionista.nome_completo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {solicitacao.itens_solicitacao.map(item => item.exame_catalogo.nome_exame).join(', ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <Link href={`/dashboard/solicitacoes/${solicitacao.id_solicitacao}`} passHref>
                                                    <button className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm font-semibold cursor-pointer">
                                                        Visualizar
                                                    </button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="md:w-1/4 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Filtros</h2>
                <form onSubmit={handleFilterSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="filterId" className="block text-sm font-medium text-gray-700">ID</label>
                        <input
                            type="text"
                            id="filterId"
                            value={filterId}
                            onChange={(e) => setFilterId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Filtrar por ID..."
                        />
                    </div>
                    <div>
                        <label htmlFor="filterPaciente" className="block text-sm font-medium text-gray-700">Paciente</label>
                        <input
                            type="text"
                            id="filterPaciente"
                            value={filterPaciente}
                            onChange={(e) => setFilterPaciente(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Filtrar por nome..."
                        />
                    </div>
                    <div>
                        <label htmlFor="filterSolicitante" className="block text-sm font-medium text-gray-700">Solicitante</label>
                        <input
                            type="text"
                            id="filterSolicitante"
                            value={filterSolicitante}
                            onChange={(e) => setFilterSolicitante(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Filtrar por nome..."
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex-1 cursor-pointer">Buscar</button>
                        <button type="button" onClick={handleClearFilters} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 flex-1 cursor-pointer">Limpar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}