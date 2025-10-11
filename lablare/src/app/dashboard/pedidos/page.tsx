'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';

// Interfaces
interface Solicitacao {
    id_solicitacao: number;
    data_hora_solicitacao: string;
    status: string;
    paciente: { nome_completo: string; cpf: string };
    aprovador?: { nome_completo: string } | null;
    itens_solicitacao: { exame_catalogo: { preco: number, nome_exame: string } }[];
    desconto_percentual: number | null;
    valor_final: number | null;
    motivo_recusa: string | null;
}

interface DadosPagamento {
    valor_pago: number;
    forma_pagamento: 'PIX' | 'ESPECIE' | 'CARTAO' | 'CONVENIO';
    tipo_atendimento: 'Presencial';
}

const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
        AGUARDANDO_APROVACAO: 'bg-yellow-100 text-yellow-800',
        AGUARDANDO_PAGAMENTO: 'bg-orange-100 text-orange-800',
        AGUARDANDO_COLETA: 'bg-blue-100 text-blue-800',
        FINALIZADO: 'bg-green-100 text-green-800',
        CANCELADO: 'bg-red-100 text-red-800',
    };
    const badgeClass = statusMap[status] || 'bg-gray-100 text-gray-800';
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
};

// Componente para o Modal de Detalhes
const PedidoDetalhesModal = ({ pedido, onClose }: { pedido: Solicitacao; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-200/80 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl overflow-hidden">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h2 className="text-xl font-bold">Detalhes do Pedido #{pedido.id_solicitacao}</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600">Paciente:</p>
                        <p className="font-semibold">{pedido.paciente.nome_completo}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">CPF:</p>
                        <p className="font-semibold">{formatCpfForDisplay(pedido.paciente.cpf) || 'Não informado'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Data:</p>
                        <p className="font-semibold">{new Date(pedido.data_hora_solicitacao).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Exames:</p>
                        <ul className="list-disc list-inside mt-2 max-h-40 overflow-y-auto">
                            {pedido.itens_solicitacao.map((item, index) => (
                                <li key={index} className="text-gray-800">{item.exame_catalogo.nome_exame}</li>
                            ))}
                        </ul>
                    </div>
                    {pedido.status === 'CANCELADO' && pedido.motivo_recusa && (
                        <div>
                            <p className="text-sm text-gray-600 font-bold text-red-600">Motivo da Recusa:</p>
                            <p className="mt-1 p-3 bg-red-50 text-red-800 rounded-md border border-red-200">
                                {pedido.motivo_recusa}
                            </p>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 cursor-pointer">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default function MeusPedidosPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const [pedidos, setPedidos] = useState<Solicitacao[]>([]);
    const [loading, setLoading] = useState(true);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [pedidoSelecionado, setPedidoSelecionado] = useState<Solicitacao | null>(null);
    const [dadosPagamento, setDadosPagamento] = useState<DadosPagamento>({
        valor_pago: 0,
        forma_pagamento: 'PIX',
        tipo_atendimento: 'Presencial',
    });
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const fetchPedidos = useCallback(async () => {
        setLoading(true);
        try {
            // CORREÇÃO: Chama a API sempre com o filtro `minhas=true`
            const url = '/api/solicitacoes?minhas=true';

            const response = await fetch(url);
            if (!response.ok) throw new Error("Falha ao buscar pedidos.");
            const data: Solicitacao[] = await response.json();
            setPedidos(data);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (sessionStatus === 'authenticated' && session.user.id) {
            fetchPedidos();
        }
        if (sessionStatus === 'unauthenticated') {
            router.push('/login');
        }
    }, [sessionStatus, session, router, fetchPedidos]);

    const handleOpenPaymentModal = (pedido: Solicitacao) => {
        const valorTotalFinal = pedido.valor_final ?? pedido.itens_solicitacao.reduce((acc, item) => acc + Number(item.exame_catalogo.preco), 0);
        setPedidoSelecionado(pedido);
        setDadosPagamento({
            ...dadosPagamento,
            valor_pago: valorTotalFinal,
        });
        setIsPaymentModalOpen(true);
    };

    const handleOpenDetailsModal = (pedido: Solicitacao) => {
        setPedidoSelecionado(pedido);
        setIsDetailsModalOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pedidoSelecionado) return;

        setIsProcessingPayment(true);
        try {
            const response = await fetch(`/api/solicitacoes/${pedidoSelecionado.id_solicitacao}/pagar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosPagamento),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success('Pagamento finalizado com sucesso!');
            
            if (data.etiquetaHtml) {
                localStorage.setItem('etiquetaHtml', data.etiquetaHtml);
                router.push('/dashboard/etiqueta');
            } else {
                setIsPaymentModalOpen(false);
                fetchPedidos();
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsProcessingPayment(false);
        }
    };
    
    const getModalContent = (pedido: Solicitacao) => {
        const subtotal = pedido.itens_solicitacao.reduce((acc, item) => acc + Number(item.exame_catalogo.preco), 0);
        const desconto = subtotal * (pedido.desconto_percentual ?? 0) / 100;
        const valorTotal = pedido.valor_final ?? subtotal - desconto;
        
        return (
            <div className="space-y-4">
                <div className="border-b pb-2">
                    <h3 className="font-semibold text-lg">Resumo do Pedido</h3>
                    <div className="max-h-40 overflow-y-auto">
                        <ul className="list-none mt-2 space-y-1">
                            {pedido.itens_solicitacao.map((item, index) => (
                                <li key={index} className="flex justify-between">
                                    <span>{item.exame_catalogo.nome_exame}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="text-right space-y-1 font-semibold text-gray-700">
                    <p>Subtotal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</p>
                    <p className="text-green-600">Desconto: -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(desconto)}</p>
                    <p className="text-xl font-bold">Total a Pagar: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}</p>
                </div>
            </div>
        );
    };

    if (loading || sessionStatus === 'loading') {
        return <div className="p-8">Carregando seus pedidos...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Pedidos</h1>
                {pedidos.length === 0 ? (
                    <p>Você ainda não criou nenhum pedido.</p>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full table-fixed divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-16 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="w-44 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                                    <th className="w-44 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprovado por</th>
                                    <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Detalhes</th>
                                    <th className="w-48 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {pedidos.map((pedido) => (
                                    <tr key={pedido.id_solicitacao}>
                                        <td className="px-6 py-4 text-sm font-medium">{pedido.id_solicitacao}</td>
                                        <td className="px-6 py-4 text-sm">{new Date(pedido.data_hora_solicitacao).toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4 text-sm">{pedido.paciente.nome_completo}</td>
                                        <td className="px-6 py-4 text-sm">{getStatusBadge(pedido.status)}</td>
                                        <td className="px-6 py-4 text-sm">{pedido.aprovador?.nome_completo || '---'}</td>
                                        <td className="px-6 py-4 text-center text-sm">
                                            <button
                                                onClick={() => handleOpenDetailsModal(pedido)}
                                                className="bg-gray-200 text-gray-800 font-semibold px-3 py-1 rounded-md hover:bg-gray-300 cursor-pointer"
                                            >
                                                Visualizar
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm">
                                            {pedido.status === 'AGUARDANDO_PAGAMENTO' && (
                                                <button
                                                    onClick={() => handleOpenPaymentModal(pedido)}
                                                    className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700"
                                                >
                                                    Finalizar Pagamento
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- MODAL DE PAGAMENTO --- */}
            {isPaymentModalOpen && pedidoSelecionado && (
                <div 
                    className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 bg-gray-200/80 backdrop-blur-sm" 
                >
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in overflow-hidden">
                        <h2 className="text-xl font-bold mb-4">Finalizar Pagamento do Pedido #{pedidoSelecionado.id_solicitacao}</h2>
                        {getModalContent(pedidoSelecionado)}
                        <form onSubmit={handlePaymentSubmit} className="mt-4">
                            <div className="mb-4">
                                <label htmlFor="valor_pago" className="block text-sm font-medium">Valor Total a Pagar</label>
                                <input
                                    id="valor_pago"
                                    type="text"
                                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dadosPagamento.valor_pago)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                                    readOnly
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="forma_pagamento" className="block text-sm font-medium">Forma de Pagamento</label>
                                <select
                                    id="forma_pagamento"
                                    value={dadosPagamento.forma_pagamento}
                                    onChange={(e) => setDadosPagamento({...dadosPagamento, forma_pagamento: e.target.value as DadosPagamento['forma_pagamento']})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    required
                                >
                                    <option value="PIX">PIX</option>
                                    <option value="ESPECIE">Espécie</option>
                                    <option value="CARTAO">Cartão</option>
                                    <option value="CONVENIO">Convênio</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Cancelar</button>
                                <button type="submit" disabled={isProcessingPayment} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                                    {isProcessingPayment ? 'Processando...' : 'Confirmar Pagamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* --- MODAL DE DETALHES --- */}
            {isDetailsModalOpen && pedidoSelecionado && (
                <PedidoDetalhesModal 
                    pedido={pedidoSelecionado} 
                    onClose={() => setIsDetailsModalOpen(false)} 
                />
            )}
        </>
    );
}