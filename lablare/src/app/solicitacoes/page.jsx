"use client"; 

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SolicitacoesPage() {
  const { data: session, status } = useSession();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canViewSolicitacoes = session?.user?.nome_perfil === 'Recepcionista' ||
                              session?.user?.nome_perfil === 'Administrador' ||
                              session?.user?.nome_perfil === 'Técnico de Laboratório' || 
                              session?.user?.nome_perfil === 'Biomédico';


  useEffect(() => {
    if (status === 'authenticated' && canViewSolicitacoes) {
      const fetchSolicitacoes = async () => {
        try {
          const response = await fetch('/api/solicitacoes');
          if (!response.ok) {
            throw new Error('Falha ao buscar solicitações.');
          }
          const data = await response.json();
          setSolicitacoes(data);
        } catch (err) {
          console.error('Erro ao carregar solicitações:', err);
          setError('Não foi possível carregar a lista de solicitações.');
        } finally {
          setLoading(false);
        }
      };
      fetchSolicitacoes();
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status, canViewSolicitacoes]);

  if (status === 'loading' || loading) {
    return <div className="text-center text-xl mt-10">Carregando solicitações...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center text-xl mt-10 p-5 bg-red-100 text-red-700 rounded-md">
        Você precisa estar logado para acessar esta página. Por favor, faça <Link href="/login" className="text-blue-600 hover:underline">login</Link>.
      </div>
    );
  }

  if (!canViewSolicitacoes) {
    return (
      <div className="text-center text-xl mt-10 p-5 bg-yellow-100 text-yellow-800 rounded-md">
        Você não tem permissão para visualizar esta página.
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Listagem de Solicitações de Exames</h1>

      {solicitacoes.length === 0 ? (
        <div className="text-center text-gray-600 p-4 border rounded-md bg-gray-50">
          Nenhuma solicitação de exame encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 border-b">ID Solicitação</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 border-b">Data/Hora</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 border-b">Paciente</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 border-b">Recepcionista</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 border-b">Médico Solicitante</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 border-b">Exames</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map((solicitacao) => (
                <tr key={solicitacao.id_solicitacao} className="hover:bg-gray-50 border-b last:border-b-0">
                  <td className="py-3 px-4 text-sm text-gray-800">{solicitacao.id_solicitacao}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    {new Date(solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    {solicitacao.paciente.nome_completo} <br />
                    <span className="text-gray-500 text-xs">CPF: {solicitacao.paciente.cpf}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    {solicitacao.recepcionista.nome_completo}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    {solicitacao.medico_solicitante || 'Não informado'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    <ul className="list-disc list-inside text-xs">
                      {solicitacao.itens_solicitacao.map((item) => (
                        <li key={item.id_item_solicitacao}>
                          {item.exame_catalogo.nome_exame} ({item.exame_catalogo.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Aguardando Coleta 
                    </span>
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
