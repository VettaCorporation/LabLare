// Caminho: src/app/dashboard/aprovar-solicitacoes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface SolicitacaoPendente {
    id_solicitacao: number;
    paciente: { nome_completo: string };
    recepcionista: { nome_completo: string };
    itens_solicitacao: { exame_catalogo: { nome_exame: string } }[];
}

export default function AprovarSolicitacoesPage() {
    const router = useRouter();
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() { router.push('/login'); },
    });

    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPendente[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSolicitacoesPendentes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/solicitacoes?status=AGUARDANDO_APROVACAO');
            if (!response.ok) throw new Error('Falha ao buscar solicitações pendentes.');
            const data = await response.json();
            setSolicitacoes(data);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchSolicitacoesPendentes();
        }
    }, [status, fetchSolicitacoesPendentes]);

    const handleVisualizarClick = (solicitacaoId: number) => {
        router.push(`/dashboard/solicitacoes/${solicitacaoId}`);
    };

    if (status === 'loading' || loading) {
        return <div className="p-8 text-center">Carregando...</div>;
    }
    
    if ((session?.user as any)?.nome_perfil !== 'Administrador') {
        return <div className="p-8 text-center text-red-600">Acesso negado.</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-6">Aprovar Solicitações Pendentes</h1>
            {solicitacoes.length === 0 ? (
                <p className="text-gray-500">Nenhuma solicitação aguardando aprovação.</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exames</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {solicitacoes.map((s) => (
                                <tr key={s.id_solicitacao}>
                                    <td className="px-6 py-4 text-sm font-medium">{s.id_solicitacao}</td>
                                    <td className="px-6 py-4 text-sm">{s.paciente.nome_completo}</td>
                                    <td className="px-6 py-4 text-sm">{s.recepcionista.nome_completo}</td>
                                    <td className="px-6 py-4 text-sm">
                                        {s.itens_solicitacao.map(item => item.exame_catalogo.nome_exame).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleVisualizarClick(s.id_solicitacao)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm font-semibold cursor-pointer">
                                            Visualizar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}