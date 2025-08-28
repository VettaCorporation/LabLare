'use client';

import React, { useState } from 'react';
import ExameSelection from '@/components/ExameSelection/ExameSelection';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';
import { useSession } from 'next-auth/react'; // Importado para obter o ID do usuário

interface Paciente {
    id_paciente: number;
    nome_completo: string;
    cpf: string;
}

interface Exame {
    id_exame_catalogo: number;
    preco: number;
    nome_exame: string;
}

interface SolicitacaoExameFormProps {
    paciente: Paciente;
    onCancel: () => void;
}

type FormaPagamento = 'PIX' | 'ESPECIE' | 'CARTAO' | 'CONVENIO';

export default function SolicitacaoExameForm({ paciente, onCancel }: SolicitacaoExameFormProps) {
    const [selectedExams, setSelectedExams] = useState<Exame[]>([]);
    const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
    const [medicoSolicitante, setMedicoSolicitante] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { data: session } = useSession(); // Obtenção da sessão do usuário
    
    const totalValue = selectedExams.reduce((sum, exame) => sum + parseFloat(String(exame.preco || 0)), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!session?.user?.id || selectedExams.length === 0) {
            toast.error("Selecione pelo menos um exame e faça login como recepcionista.");
            setIsLoading(false);
            return;
        }

        try {
            // CORREÇÃO: O payload agora corresponde exatamente ao que a API espera
            const payload = {
                id_paciente: paciente.id_paciente,
                id_usuario_solicitante: Number(session.user.id),
                examesSelecionados: selectedExams.map(e => ({ id_exame_catalogo: e.id_exame_catalogo })),
                medico_solicitante: medicoSolicitante,
                tipo_atendimento: 'Presencial',
                forma_pagamento: formaPagamento,
                valor_pago: totalValue,
            };

            const response = await fetch('/api/solicitacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha ao registrar solicitação.');
            }

            toast.success("Solicitação e pagamento confirmados com sucesso!");
            
            if (data.etiquetaHtml) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(data.etiquetaHtml);
                    printWindow.document.close();
                } else {
                    toast.warn('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
                }
            }
            
            router.push('/dashboard');
            onCancel();
        } catch (error: any) {
            console.error("Erro ao registrar solicitação:", error);
            toast.error(error.message || "Erro ao registrar solicitação.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Registrar Solicitação</h1>
                <button onClick={onCancel} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Voltar para Pacientes
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-inner">
                <div className="space-y-4">
                    {/* Dados do Paciente */}
                    <div className="flex flex-col gap-1 p-4 bg-gray-100 dark:bg-gray-900 rounded-md">
                        <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">Paciente: {paciente.nome_completo}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">CPF: {formatCpfForDisplay(paciente.cpf)}</p>
                    </div>

                    {/* Novo campo para o médico solicitante */}
                    <div>
                        <label htmlFor="medicoSolicitante" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Médico Solicitante (opcional)
                        </label>
                        <input
                            id="medicoSolicitante"
                            type="text"
                            value={medicoSolicitante}
                            onChange={(e) => setMedicoSolicitante(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    {/* Componente de seleção de exames */}
                    <ExameSelection onExamesSelected={setSelectedExams} />

                    {/* Resumo do Pedido */}
                    <div className="mt-6 border-t pt-6 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Resumo do Pedido</h2>
                        <ul className="space-y-2 text-base">
                            {selectedExams.map(exame => (
                                <li key={exame.id_exame_catalogo} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                    <span>{exame.nome_exame}</span>
                                    <span className="font-semibold">
                                      {parseFloat(String(exame.preco || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-between items-center text-xl font-bold mt-4 pt-4 border-t dark:border-gray-700">
                            <span>Total a Pagar:</span>
                            <span>{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </div>

                    {/* Pagamento */}
                    <div className="mt-6 border-t pt-6 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Forma de Pagamento</h2>
                        <div className="flex flex-wrap gap-4">
                            {['PIX', 'ESPECIE', 'CARTAO', 'CONVENIO'].map(method => (
                                <label key={method} className="inline-flex items-center text-gray-700 dark:text-gray-300 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="formaPagamento"
                                        value={method}
                                        checked={formaPagamento === method}
                                        onChange={() => setFormaPagamento(method as FormaPagamento)}
                                        className="form-radio text-blue-600 h-5 w-5 transition duration-150 ease-in-out"
                                    />
                                    <span className="ml-2 text-base">{method.charAt(0) + method.slice(1).toLowerCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    {/* Botões de Ação */}
                    <div className="flex justify-end gap-x-4 mt-8 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading || selectedExams.length === 0}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Processando...' : 'Confirmar Pagamento'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
