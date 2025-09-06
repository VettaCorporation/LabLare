'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

// Interfaces
interface Solicitacao {
    id_solicitacao: number;
    data_hora_solicitacao: string;
    status: string;
    paciente: { nome_completo: string };
    aprovador?: { nome_completo: string } | null;
    itens_solicitacao: { exame_catalogo: { preco: number, nome_exame: string } }[];
    desconto_percentual: number | null;
    valor_final: number | null;
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

export default function MeusPedidosPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const [pedidos, setPedidos] = useState<Solicitacao[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pedidoSelecionado, setPedidoSelecionado] = useState<Solicitacao | null>(null);
    const [dadosPagamento, setDadosPagamento] = useState<DadosPagamento>({
        valor_pago: 0,
        forma_pagamento: 'PIX',
        tipo_atendimento: 'Presencial',
    });
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);


    const fetchPedidos = useCallback(async (userId: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/solicitacoes?recepcionistaId=${userId}`);
            if (!response.ok) throw new Error("Falha ao buscar pedidos.");
            const data = await response.json();
            setPedidos(data);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (sessionStatus === 'authenticated' && session.user.id) {
            fetchPedidos(Number(session.user.id));
        }
        if (sessionStatus === 'unauthenticated') {
            router.push('/login');
        }
    }, [session, sessionStatus, router, fetchPedidos]);

    const handleOpenPaymentModal = (pedido: Solicitacao) => {
        const valorTotalFinal = pedido.valor_final ?? pedido.itens_solicitacao.reduce((acc, item) => acc + Number(item.exame_catalogo.preco), 0);
        setPedidoSelecionado(pedido);
        setDadosPagamento({
            ...dadosPagamento,
            valor_pago: valorTotalFinal,
        });
        setIsModalOpen(true);
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
                setIsModalOpen(false);
                fetchPedidos(Number(session?.user?.id));
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
                    <ul className="list-none mt-2 space-y-1">
                        {pedido.itens_solicitacao.map((item, index) => (
                            <li key={index} className="flex justify-between">
                                <span>{item.exame_catalogo.nome_exame}</span>
                            </li>
                        ))}
                    </ul>
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
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprovado por</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
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
            {isModalOpen && pedidoSelecionado && (
                <div 
                    className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300" 
                    style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in">
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
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Cancelar</button>
                                <button type="submit" disabled={isProcessingPayment} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                                    {isProcessingPayment ? 'Processando...' : 'Confirmar Pagamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
