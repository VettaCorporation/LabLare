'use client';
import { useState } from 'react';

interface Props {
    onClose: () => void;
    onSuccess: (novoExame: any) => void;
}

export default function ExameCatalogoFormModal({ onClose, onSuccess }: Props) {
    const [nomeExame, setNomeExame] = useState('');
    const [codigoInterno, setCodigoInterno] = useState(''); // <-- NOVO ESTADO
    const [preco, setPreco] = useState('');
    const [descricao, setDescricao] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/exames-catalogo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_exame: nomeExame,
                    preco: preco.replace(',', '.'),
                    descricao,
                    codigo_interno: codigoInterno, // <-- ENVIANDO O NOVO CAMPO
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha ao salvar o exame.');
            }

            const novoExame = await response.json();
            onSuccess(novoExame);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Cadastrar Novo Exame Interno</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nome_exame" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Exame</label>
                        <input id="nome_exame" type="text" value={nomeExame} onChange={(e) => setNomeExame(e.target.value)} required className="mt-1 block w-full rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="codigo_interno" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código Interno (Opcional)</label>
                        <input id="codigo_interno" type="text" value={codigoInterno} onChange={(e) => setCodigoInterno(e.target.value)} className="mt-1 block w-full rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="preco" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço (R$)</label>
                        <input id="preco" type="text" placeholder="25,50" value={preco} onChange={(e) => setPreco(e.target.value)} required className="mt-1 block w-full rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (Opcional)</label>
                        <textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="mt-1 block w-full rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400">{isLoading ? 'Salvando...' : 'Salvar Exame'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}