'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importa a nova função de formatação de moeda
import { formatCurrencyOnType } from '@/utils/currencyFormatter';

interface ExameFormData {
    nome_exame: string;
    preco: string;
    origem: 'LARE' | 'PARDINI';
    codigo_pardini: string;
    descricao: string;
}

export default function NovoExamePage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ExameFormData>({
        nome_exame: '',
        preco: '',
        origem: 'LARE',
        codigo_pardini: '',
        descricao: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        
        if (id === 'preco') {
            const formattedValue = formatCurrencyOnType(value);
            setFormData(prev => ({ ...prev, [id]: formattedValue }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!formData.nome_exame || !formData.preco) {
            toast.error('Nome do exame e preço são obrigatórios.');
            setIsLoading(false);
            return;
        }
        
        if (formData.origem === 'PARDINI' && !formData.codigo_pardini) {
            toast.error('Código Pardini é obrigatório para exames desta origem.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/exames`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_exame: formData.nome_exame,
                    origem: formData.origem,
                    preco: parseFloat(formData.preco.replace(/\D/g, '')) / 100 || 0,
                    codigo_pardini: formData.origem === 'PARDINI' ? formData.codigo_pardini : null,
                    descricao: formData.descricao,
                }),
            });
            const data = await response.json();

            if (response.ok) {
                toast.success('Exame criado com sucesso!');
                setTimeout(() => {
                    router.push('/dashboard/exames');
                }, 1500);
            } else {
                toast.error(data.message || 'Erro ao criar o exame.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Ocorreu um erro inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard/exames" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Voltar para a lista de exames
                    </Link>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
                    Adicionar Novo Exame
                </h1>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="nome_exame" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Exame</label>
                            <input type="text" id="nome_exame" value={formData.nome_exame} onChange={handleChange} required className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        
                        <div>
                            <label htmlFor="origem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Origem</label>
                            <select id="origem" value={formData.origem} onChange={handleChange} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option value="LARE">LARE</option>
                                <option value="PARDINI">PARDINI</option>
                            </select>
                        </div>
                        
                        {formData.origem === 'PARDINI' && (
                            <div>
                                <label htmlFor="codigo_pardini" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código Pardini</label>
                                <input type="text" id="codigo_pardini" value={formData.codigo_pardini} onChange={handleChange} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                        )}
                        
                        <div>
                            <label htmlFor="preco" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço</label>
                            <input
                              type="text"
                              id="preco"
                              value={formData.preco}
                              onChange={handleChange}
                              required
                              placeholder="ex: R$ 25,50"
                              className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        
                        <div>
                            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (Opcional)</label>
                            <textarea id="descricao" value={formData.descricao} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        
                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Link href="/dashboard/exames" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                                Cancelar
                            </Link>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {isLoading ? 'A Criar...' : 'Criar Exame'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
