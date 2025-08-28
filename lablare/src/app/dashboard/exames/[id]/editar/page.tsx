'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import { toast } from 'react-toastify';

interface Exame {
    id_exame_catalogo: number;
    nome_exame: string;
    descricao: string | null;
    preco: number;
    codigo_lare: string | null;
    codigo_pardini: string | null;
    origem: 'LARE' | 'PARDINI';
}

export default function EditarExamePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [exame, setExame] = useState<Exame | null>(null);
    const [formData, setFormData] = useState({
        nome_exame: '',
        descricao: '',
        preco: '',
        codigo: '',
    });
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchExameData = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/exames-catalogo/${id}`);
            if (!response.ok) throw new Error('Falha ao buscar dados do exame.');
            const data: Exame = await response.json();
            
            setExame(data);
            setFormData({
                nome_exame: data.nome_exame || '',
                descricao: data.descricao || '',
                preco: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(data.preco) || '0,00',
                codigo: data.origem === 'LARE' ? (data.codigo_lare || '') : (data.codigo_pardini || ''),
            });
        } catch (err) {
            setMessage('Erro ao carregar o exame.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchExameData();
    }, [fetchExameData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        
        // Converte o preço formatado para um número para o payload
        const numericPreco = parseFloat(formData.preco.replace('.', '').replace(',', '.'));

        const submissionData = {
            nome_exame: formData.nome_exame,
            descricao: formData.descricao,
            preco: numericPreco,
            codigo_lare: exame?.origem === 'LARE' ? formData.codigo : exame?.codigo_lare,
            codigo_pardini: exame?.origem === 'PARDINI' ? formData.codigo : exame?.codigo_pardini,
        };

        try {
            const response = await fetch(`/api/exames-catalogo/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });
            const data = await response.json();

            if (response.ok) {
                toast.success('Exame atualizado com sucesso!');
                router.push('/dashboard/exames');
            } else {
                setMessage(data.message || 'Erro ao atualizar o exame.');
                toast.error(data.message || 'Erro ao atualizar o exame.');
            }
        } catch (err: any) {
            setMessage(err.message || 'Ocorreu um erro inesperado.');
            toast.error(err.message || 'Ocorreu um erro inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
             <div className="p-4 sm:p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                        <FormSkeleton />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!exame) {
        return <div className="text-center p-8 text-red-500">{message || 'Exame não encontrado.'}</div>;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard/exames" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Voltar para a lista de exames
                    </Link>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Editar Exame
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    A fazer alterações para: <span className="font-semibold text-gray-700 dark:text-gray-200">{exame.nome_exame} (ID: {id})</span>
                </p>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="nome_exame" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Exame</label>
                            <input type="text" id="nome_exame" value={formData.nome_exame} onChange={handleChange} required className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {exame.origem === 'LARE' ? 'Código Lare' : 'Código Pardini'}
                                </label>
                                <input type="text" id="codigo" value={formData.codigo} onChange={handleChange} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                            <div>
                                <label htmlFor="preco" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço</label>
                                <input type="text" id="preco" value={formData.preco} onChange={handleChange} required placeholder="ex: 25,50" className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (Opcional)</label>
                            <textarea id="descricao" value={formData.descricao} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>

                        {message && <div className="p-3 rounded-md text-sm bg-red-100 text-red-800">{message}</div>}

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Link href="/dashboard/exames" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</Link>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">{isLoading ? 'A atualizar...' : 'Salvar Alterações'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
