// Caminho: src/app/dashboard/solicitacoes/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

// Interfaces para os dados detalhados
interface SolicitacaoDetalhada {
    id_solicitacao: number;
    status: string;
    medico_solicitante: string | null;
    data_hora_solicitacao: string;
    paciente: { 
        nome_completo: string;
    };
    recepcionista: {
        nome_completo: string;
    };
    itens_solicitacao: { 
        id_item_solicitacao: number;
        exame_catalogo: { 
            nome_exame: string, 
            preco: number 
        } 
    }[];
}

export default function SolicitacaoDetalhePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { data: session, status: sessionStatus } = useSession();

    const [solicitacao, setSolicitacao] = useState<SolicitacaoDetalhada | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false); // Renomeado de isApproving

    const fetchDetalhes = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/solicitacoes/${id}`);
            if (!response.ok) throw new Error('Falha ao buscar detalhes da solicitação.');
            const data = await response.json();
            setSolicitacao(data);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            fetchDetalhes();
        }
    }, [sessionStatus, fetchDetalhes]);

    // --- FUNÇÃO DE APROVAÇÃO SIMPLIFICADA ---
    const handleApprove = async () => {
        if (!solicitacao) return;

        setIsProcessing(true);
        try {
            // A chamada para a API agora é mais simples, sem corpo (body)
            const response = await fetch(`/api/solicitacoes/${solicitacao.id_solicitacao}/aprovar`, {
                method: 'POST',
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            toast.success('Solicitação aprovada! O solicitante foi notificado para realizar o pagamento.');
            // Redireciona de volta para a lista de aprovações
            router.push('/dashboard/aprovar-solicitacoes');
            router.refresh(); 
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // Futura função de edição
    const handleEdit = () => {
        toast.info("Funcionalidade de edição a ser implementada.");
    };

    if (loading || sessionStatus === 'loading') {
        return <div className="p-8 text-center">Carregando detalhes da solicitação...</div>;
    }

    if (!solicitacao) {
        return <div className="p-8 text-center">Solicitação não encontrada.</div>;
    }

    const valorTotal = solicitacao.itens_solicitacao.reduce((acc, item) => acc + Number(item.exame_catalogo.preco), 0);

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
                {/* Coluna de Informações */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Paciente</h2>
                        <p>{solicitacao.paciente.nome_completo}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Médico Solicitante</h2>
                        <p>{solicitacao.medico_solicitante || 'Não informado'}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Exames Solicitados</h2>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                            {solicitacao.itens_solicitacao.map(item => (
                                <li key={item.id_item_solicitacao}>
                                    {item.exame_catalogo.nome_exame}
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div className="border-t pt-4 mt-4">
                        <p className="text-right text-lg font-bold">
                            Valor Total: {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                </div>

                {/* Coluna de Ações do Administrador */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações</h2>
                    
                    {solicitacao.status === 'AGUARDANDO_APROVACAO' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Revise os detalhes da solicitação. Você pode editar os exames ou aprovar o pedido para que o solicitante possa prosseguir com o pagamento.
                            </p>
                            <div className="flex gap-4 border-t pt-4 mt-4">
                               <button 
                                    onClick={handleEdit}
                                    disabled={isProcessing}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:bg-gray-300">
                                    Editar
                               </button>
                               <button 
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400">
                                    {isProcessing ? 'Processando...' : 'Aprovar Solicitação'}
                               </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-600">Esta solicitação já foi processada e não pode mais ser alterada a partir desta tela.</p>
                    )}
                </div>
            </div>
        </div>
    );
}