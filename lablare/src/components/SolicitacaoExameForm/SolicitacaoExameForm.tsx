'use client';

import React, { useState } from 'react';
import ExameSelection from '@/components/ExameSelection/ExameSelection';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const totalValue = selectedExams.reduce((sum, exame) => sum + (exame.preco || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (selectedExams.length === 0) {
            toast.error("Selecione pelo menos um exame.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/solicitacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pacienteId: paciente.id_paciente,
                    exames: selectedExams.map(e => ({ id: e.id_exame_catalogo, preco: e.preco })),
                    formaPagamento,
                }),
            });

            if (!response.ok) {
                throw new Error('Falha ao registrar solicitação.');
            }

            toast.success("Solicitação e pagamento confirmados com sucesso!");
            onCancel(); // Volta para a lista de pacientes ou outra tela
        } catch (error) {
            console.error("Erro ao registrar solicitação:", error);
            toast.error("Erro ao registrar solicitação.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Registrar Solicitação</h1>
                <button onClick={onCancel} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Voltar para Pacientes
                </button>
            </div>
            <div className="space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Paciente: {paciente.nome_completo}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CPF: {paciente.cpf}</p>
                </div>

                <ExameSelection onExamesSelected={setSelectedExams} />

                <div className="mt-6 p-4 border-t dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Resumo do Pedido</h2>
                    <ul className="space-y-2">
                        {selectedExams.map(exame => (
                            <li key={exame.id_exame_catalogo} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                <span>{exame.nome_exame}</span>
                                <span>{exame.preco ? exame.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between items-center font-bold text-lg mt-4 border-t pt-4 dark:border-gray-700">
                        <span>Total a Pagar:</span>
                        <span>{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>

                <div className="mt-6 p-4 border-t dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Pagamento</h2>
                    <div className="flex gap-4">
                        {['PIX', 'ESPECIE', 'CARTAO', 'CONVENIO'].map(method => (
                            <label key={method} className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="formaPagamento"
                                    value={method}
                                    checked={formaPagamento === method}
                                    onChange={() => setFormaPagamento(method as FormaPagamento)}
                                    className="form-radio text-blue-600"
                                />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">{method.charAt(0) + method.slice(1).toLowerCase()}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-x-4 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || selectedExams.length === 0}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processando...' : 'Confirmar Pagamento'}
                    </button>
                </div>
            </div>
        </div>
    );
}