'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import ExameSelection from '@/components/ExameSelection/ExameSelection';

// Interfaces
interface ExameItem {
    id_exame_catalogo: number;
    nome_exame: string;
    preco: number;
}
interface SolicitacaoDetalhada {
    id_solicitacao: number;
    status: string;
    medico_solicitante: string | null;
    data_hora_solicitacao: string;
    paciente: { nome_completo: string };
    recepcionista: { nome_completo: string };
    itens_solicitacao: { id_item_solicitacao: number, exame_catalogo: ExameItem }[];
}

export default function SolicitacaoDetalhePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { data: session, status: sessionStatus } = useSession();

    const [solicitacao, setSolicitacao] = useState<SolicitacaoDetalhada | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [examesEditados, setExamesEditados] = useState<ExameItem[]>([]);

    const fetchDetalhes = useCallback(async () => {
        if (!id || sessionStatus !== 'authenticated') return;
        setLoading(true);
        try {
            const response = await fetch(`/api/solicitacoes/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao buscar detalhes.');
            }
            const data: SolicitacaoDetalhada = await response.json();
            setSolicitacao(data);
            setExamesEditados(data.itens_solicitacao.map(item => item.exame_catalogo));
        } catch (err: any) {
            toast.error(err.message);
            setSolicitacao(null);
        } finally {
            setLoading(false);
        }
    }, [id, sessionStatus]);

    useEffect(() => {
        fetchDetalhes();
    }, [fetchDetalhes]);

    const handleApprove = async () => {
        if (!solicitacao) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/solicitacoes/${solicitacao.id_solicitacao}/aprovar`, {
                method: 'POST',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            toast.success('Solicitação aprovada! Aguardando pagamento.');
            router.push('/dashboard/aprovar-solicitacoes');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleEditClick = () => setIsEditing(true);
    const handleCancelEdit = () => {
        // Restaura os exames originais ao cancelar
        if (solicitacao) {
            setExamesEditados(solicitacao.itens_solicitacao.map(item => item.exame_catalogo));
        }
        setIsEditing(false);
    };
    
    const handleSaveEdit = async () => {
        if (!solicitacao) return;
        setIsProcessing(true);
        try {
            const payload = {
                examesSelecionados: examesEditados.map(ex => ({ id_exame_catalogo: ex.id_exame_catalogo })),
            };
            const response = await fetch(`/api/solicitacoes/${solicitacao.id_solicitacao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success('Solicitação atualizada com sucesso!');
            setIsEditing(false);
            fetchDetalhes(); // Re-busca os dados para mostrar a lista atualizada
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading || sessionStatus === 'loading') {
        return <div className="p-8 text-center">Carregando detalhes...</div>;
    }

    if (!solicitacao) {
        return <div className="p-8 text-center text-red-500">Não foi possível carregar os dados da solicitação. Tente novamente.</div>;
    }

    const valorTotal = (isEditing ? examesEditados : solicitacao.itens_solicitacao.map(item => item.exame_catalogo))
                       .reduce((acc, exame) => acc + Number(exame.preco), 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold">Detalhes da Solicitação #{solicitacao.id_solicitacao}</h1>
                    <p className="text-gray-500">
                        Solicitado por {solicitacao.recepcionista.nome_completo} em {new Date(solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800`}>
                    {solicitacao.status.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Paciente</h2>
                        <p>{solicitacao.paciente.nome_completo}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Exames Solicitados</h2>
                        {isEditing ? (
                            <div className="mt-4">
                                <ExameSelection 
                                    selectedExams={examesEditados}
                                    onExamesSelected={setExamesEditados} 
                                />
                            </div>
                        ) : (
                            <ul className="list-disc list-inside space-y-1 mt-2">
                                {solicitacao.itens_solicitacao.map(item => (
                                    <li key={item.id_item_solicitacao}>{item.exame_catalogo.nome_exame}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                     <div className="border-t pt-4 mt-4">
                        <p className="text-right text-lg font-bold">
                            Valor Total: {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações</h2>
                    {solicitacao.status === 'AGUARDANDO_APROVACAO' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                {isEditing ? "Modifique a lista de exames e salve." : "Revise os detalhes antes de aprovar."}
                            </p>
                            <div className="flex gap-4 border-t pt-4 mt-4">
                               {isEditing ? (
                                   <>
                                    <button onClick={handleSaveEdit} disabled={isProcessing} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer">{isProcessing ? 'Salvando...' : 'Salvar'}</button>
                                    <button onClick={handleCancelEdit} disabled={isProcessing} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 cursor-pointer">Cancelar</button>
                                   </>
                               ) : (
                                   <>
                                    <button onClick={handleEditClick} disabled={isProcessing} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 cursor-pointer">Editar</button>
                                    <button onClick={handleApprove} disabled={isProcessing} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400 cursor-pointer">{isProcessing ? 'Aprovando...' : 'Aprovar'}</button>
                                   </>
                               )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-600">Esta solicitação já foi processada.</p>
                    )}
                </div>
            </div>
        </div>
    );
}