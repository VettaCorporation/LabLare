'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

interface PerfilComPrivilegios {
    id_perfil: number;
    nome_perfil: string;
    privilegios: string[];
}

interface PrivilegioDisponivel {
    rota: string;
    nome: string;
    descricao: string;
}

const mapPrivilegioToCategory = (rota: string): string => {
    const categories: { [key: string]: string } = {
        '/dashboard': 'Geral',
        '/dashboard/configuracoes/alterar-senha': 'Geral',
        '/dashboard/solicitar-exame': 'Atendimento',
        '/dashboard/pacientes': 'Atendimento',
        '/dashboard/etiqueta': 'Atendimento',
        '/dashboard/pedidos': 'Atendimento',
        '/dashboard/aprovar-solicitacoes': 'Atendimento',
        '/dashboard/recebimento-amostras': 'Laboratório',
        '/dashboard/lancamento-resultados': 'Laboratório',
        '/dashboard/laudo': 'Laboratório',
        '/dashboard/orcamento': 'Financeiro',
        '/dashboard/exames': 'Administração',
        '/dashboard/colaboradores': 'Administração',
        '/dashboard/privilegios': 'Administração',
        '/dashboard/configuracoes': 'Administração',
        '/dashboard/pacientes/editar': 'Administração',
        '/dashboard/pacientes/excluir': 'Administração',
    };
    return categories[rota] || 'Outros';
};

const groupPrivilegesByCategory = (privilegios: PrivilegioDisponivel[]): Record<string, PrivilegioDisponivel[]> => {
    const grouped: Record<string, PrivilegioDisponivel[]> = {};
    privilegios.forEach(p => {
        const category = mapPrivilegioToCategory(p.rota);
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(p);
    });
    return grouped;
};

export default function PrivilegiosPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [perfis, setPerfis] = useState<PerfilComPrivilegios[]>([]);
    const [abaAtivaId, setAbaAtivaId] = useState<number | null>(null);
    const [privilegiosDisponiveis, setPrivilegiosDisponiveis] = useState<PrivilegioDisponivel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const canAccessPage = (session?.user as any)?.nome_perfil === 'Administrador';

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/privilegios');
            if (!response.ok) throw new Error("Falha ao buscar perfis e privilégios.");
            const data = await response.json();
            
            setPerfis(data.perfis);
            setPrivilegiosDisponiveis(data.todosPrivilegios);

            if (data.perfis.length > 0) {
                setAbaAtivaId(data.perfis[0].id_perfil);
            }
        } catch (error) {
            console.error("Erro ao buscar dados", error);
            toast.error('Erro ao carregar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated' && canAccessPage) {
            fetchData();
        }
    }, [status, canAccessPage, fetchData]);

    const perfilSelecionado = perfis.find(p => p.id_perfil === abaAtivaId);
    const privilegiosDoPerfil = perfilSelecionado?.privilegios ?? [];

    const handleTogglePrivilegio = async (rota: string) => {
        if (!abaAtivaId || !perfilSelecionado) return;

        setSaving(true);
        try {
            const novosPrivilegios = privilegiosDoPerfil.includes(rota)
                ? privilegiosDoPerfil.filter(p => p !== rota)
                : [...privilegiosDoPerfil, rota];

            const response = await fetch('/api/privilegios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_perfil: abaAtivaId, privilegios: novosPrivilegios }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }

            toast.success('Privilégios atualizados com sucesso!');
            await fetchData();
        } catch (error: any) {
            console.error("Erro ao atualizar privilégios", error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const groupedAvailablePrivileges = groupPrivilegesByCategory(privilegiosDisponiveis);
    
    if (status === 'loading' || loading) {
        return <div className="p-8 dark:text-gray-300">Carregando gerenciador de privilégios...</div>;
    }
    if (status === 'unauthenticated' || !canAccessPage) {
        router.push('/dashboard');
        return null;
    }

    return (
        <div className="space-y-8 p-6">
            <div className="flex items-center gap-4 mb-8">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gerenciamento de Privilégios</h1>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <label htmlFor="perfil-select" className="text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                        Selecionar Perfil:
                    </label>
                    <select
                        id="perfil-select"
                        value={abaAtivaId ?? ''}
                        onChange={(e) => setAbaAtivaId(Number(e.target.value))}
                        className="w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        disabled={loading || saving}
                    >
                        {perfis.map(perfil => (
                            <option key={perfil.id_perfil} value={perfil.id_perfil}>
                                {perfil.nome_perfil}
                            </option>
                        ))}
                    </select>
                </div>

                {perfilSelecionado && (
                    <div className="py-6 space-y-8">
                        {Object.entries(groupedAvailablePrivileges).map(([category, privileges]) => (
                            <div key={category} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">{category}</h3>
                                <div className="flex flex-wrap gap-4">
                                    {privileges.map((p) => {
                                        const isChecked = privilegiosDoPerfil.includes(p.rota);
                                        return (
                                            <button
                                                key={p.rota}
                                                onClick={() => handleTogglePrivilegio(p.rota)}
                                                className={`flex items-center gap-2 py-2 px-4 rounded-full transition-colors duration-200 cursor-pointer ${
                                                  isChecked
                                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                                disabled={saving}
                                              >
                                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${isChecked ? 'bg-green-500' : 'bg-gray-400'}`}>
                                                  <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${isChecked ? 'translate-x-6' : 'translate-x-1'}`}
                                                  />
                                                </div>
                                                <span className="ml-2 font-medium">{p.nome}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}