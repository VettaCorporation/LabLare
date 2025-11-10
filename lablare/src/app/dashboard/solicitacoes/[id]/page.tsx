'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import ExameSelection from '@/components/ExameSelection/ExameSelection';
import { FaTimes, FaCheck, FaEdit, FaSave, FaUndo, FaPencilAlt } from 'react-icons/fa';

// Interfaces
interface Exame {
    id_exame_catalogo: number;
    nome_exame: string;
    preco: number;
    origem: string;
}

interface ExameItem extends Exame {
    id_item_solicitacao: number;
}

interface SolicitacaoDetalhada {
    id_solicitacao: number;
    status: string;
    medico_solicitante: string | null;
    data_hora_solicitacao: string;
    paciente: { nome_completo: string; id_paciente: number; };
    recepcionista: { nome_completo: string };
    aprovador: { nome_completo: string } | null;
    itens_solicitacao: { id_item_solicitacao: number, exame_catalogo: ExameItem, preco_item: number }[];
    desconto_percentual: number;
    valor_final: number;
}

// Função para limpar e converter o input de desconto
const parseDiscountInput = (inputString: string): number => {
    if (!inputString) return 0;
    const cleanedString = inputString.replace(/<|>|%|\s/g, '').replace(',', '.');
    return parseFloat(cleanedString) || 0;
};

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
    const [desconto, setDesconto] = useState<number>(0);
    const [descontoInput, setDescontoInput] = useState<string>('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [motivoRecusa, setMotivoRecusa] = useState('');

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
            const mappedExames = data.itens_solicitacao.map(item => ({
                ...item.exame_catalogo,
                preco: Number(item.preco_item) ?? Number(item.exame_catalogo.preco),
                origem: 'catalogo'
            }));
            setSolicitacao(data);
            setExamesEditados(mappedExames);
            setDesconto(data.desconto_percentual || 0);
            setDescontoInput(data.desconto_percentual ? data.desconto_percentual.toString() : '');
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

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawInput = e.target.value;
        setDescontoInput(rawInput);
        const parsedValue = parseDiscountInput(rawInput);
        setDesconto(parsedValue);
    };

    const valorTotalOriginal = (isEditing ? 
        examesEditados.reduce((acc, exame) => acc + (Number(exame.preco) || 0), 0) 
        : (solicitacao?.itens_solicitacao || []).reduce((acc, item) => acc + (Number(item.preco_item) || 0), 0)
    );

    const subtotalComDesconto = valorTotalOriginal * (1 - (desconto / 100));
    
    // CÁLCULO PARA O VALOR DO DESCONTO ABSOLUTO
    const valorDoDesconto = valorTotalOriginal - subtotalComDesconto; 

    const handleApprove = async () => {
        if (!solicitacao || sessionStatus !== 'authenticated') return;
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/solicitacoes/${solicitacao.id_solicitacao}/aprovar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    desconto_percentual: desconto,
                    valor_final: subtotalComDesconto,
                    aprovadorId: session?.user?.id,
                })
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

    const handleReject = async () => {
        if (!solicitacao || sessionStatus !== 'authenticated') return;
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/solicitacoes/${solicitacao.id_solicitacao}/recusar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo: motivoRecusa }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success('Solicitação recusada!');
            router.push('/dashboard/aprovar-solicitacoes');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsProcessing(false);
            setShowRejectModal(false);
        }
    };

    const handleEditClick = () => setIsEditing(true);

    const handleCancelEdit = () => {
        if (solicitacao) {
            const mappedExames = solicitacao.itens_solicitacao.map(item => ({
                ...item.exame_catalogo,
                preco: Number(item.preco_item), 
            }));
            setExamesEditados(mappedExames as ExameItem[]);
            setDesconto(solicitacao.desconto_percentual || 0);
            setDescontoInput(solicitacao.desconto_percentual ? solicitacao.desconto_percentual.toString() : '');
        }
        setIsEditing(false);
    };

    const handleSaveEdit = async () => {
        if (!solicitacao) return;
        setIsProcessing(true);
        try {
            const payload = {
                examesSelecionados: examesEditados.map(ex => ({ id_exame_catalogo: ex.id_exame_catalogo })),
                desconto_percentual: desconto,
                valor_final: subtotalComDesconto,
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
            fetchDetalhes();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVoltar = () => {
        router.push('/dashboard/aprovar-solicitacoes');
    };

    if (loading || sessionStatus === 'loading') {
        return <div className="p-8 text-center">Carregando detalhes...</div>;
    }

    if (!solicitacao) {
        return <div className="p-8 text-center text-red-500">Não foi possível carregar os dados da solicitação. Tente novamente.</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold">Detalhes da Solicitação #{solicitacao.id_solicitacao}</h1>
                    <p className="text-gray-500">
                        Solicitado por {solicitacao.recepcionista.nome_completo} em {new Date(solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}
                    </p>
                    {solicitacao.aprovador && (
                        <p className="text-gray-500">
                            Aprovado por {solicitacao.aprovador.nome_completo}
                        </p>
                    )}
                </div>
                <button onClick={handleVoltar} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 cursor-pointer">
                    Voltar para Aprovações
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Paciente</h2>
                        <p className="text-gray-900">{solicitacao.paciente.nome_completo}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Exames Solicitados</h2>
                        {isEditing ? (
                            <div className="mt-4">
                                <ExameSelection
                                    selectedExams={examesEditados as any}
                                    onExamesSelected={(exames) => setExamesEditados(exames as ExameItem[])}
                                />
                                <div className="mt-4 p-4 border rounded-md">
                                    <h3 className="text-md font-semibold">Resumo da Edição</h3>
                                    <ul className="list-disc list-inside space-y-1 mt-2">
                                        {examesEditados.map(item => (
                                            <li key={item.id_exame_catalogo} className="flex justify-between items-center">
                                                <span>{item.nome_exame}</span>
                                                <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <ul className="list-disc list-inside space-y-1 mt-2">
                                {solicitacao.itens_solicitacao.map(item => (
                                    <li key={item.id_item_solicitacao} className="flex justify-between items-center">
                                        <span>{item.exame_catalogo.nome_exame}</span>
                                        <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.preco_item))}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    <div className="border-t pt-4 mt-4 space-y-2">
                        <p className="text-right text-lg font-bold text-gray-700">
                            Valor Total Original: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalOriginal)}
                        </p>
                        
                        {valorDoDesconto > 0 && (
                            <p className="text-right text-base text-red-600 font-semibold">
                                Desconto Aplicado (
                                {
                                    // *** CORREÇÃO AQUI: Formatando sem casas decimais (maximumFractionDigits: 0) ***
                                    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(desconto)
                                }
                                %): -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorDoDesconto)}
                            </p>
                        )}
                        
                        {isEditing && (
                            <div className="flex items-center justify-end gap-2">
                                <label htmlFor="desconto" className="text-gray-600">Desconto (%):</label>
                                <input
                                    id="desconto"
                                    type="text"
                                    value={descontoInput}
                                    onChange={handleDiscountChange}
                                    className="w-20 p-2 border rounded-md text-right"
                                />
                            </div>
                        )}
                        <p className="text-right text-xl font-bold text-green-700">
                            Subtotal com Desconto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotalComDesconto)}
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
                                        <button onClick={handleSaveEdit} disabled={isProcessing} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer">{isProcessing ? 'Salvando...' : 'Salvar Edição'}<FaSave /></button>
                                        <button onClick={handleCancelEdit} disabled={isProcessing} className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 cursor-pointer">Cancelar<FaUndo /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={handleEditClick} disabled={isProcessing} className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 cursor-pointer">Editar<FaEdit /></button>
                                        <button onClick={handleApprove} disabled={isProcessing} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400 cursor-pointer">{isProcessing ? 'Aprovando...' : 'Aprovar'}<FaCheck /></button>
                                        <button onClick={() => setShowRejectModal(true)} disabled={isProcessing} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-400 cursor-pointer">Recusar<FaTimes /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-600">Esta solicitação já foi processada.</p>
                    )}
                </div>
            </div>
            {/* Modal para recusa */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full flex items-center justify-center backdrop-blur-sm z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Recusar Solicitação</h3>
                        <p className="mb-4">Por favor, insira o motivo da recusa para a solicitação #{solicitacao?.id_solicitacao}.</p>
                        <textarea
                            className="w-full p-2 border rounded-md"
                            rows={4}
                            value={motivoRecusa}
                            onChange={(e) => setMotivoRecusa(e.target.value)}
                            placeholder="Motivo da recusa..."
                        ></textarea>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowRejectModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 cursor-pointer">
                                Cancelar
                            </button>
                            <button onClick={handleReject} disabled={isProcessing || motivoRecusa.trim() === ''} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-400 cursor-pointer">
                                Confirmar Recusa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}