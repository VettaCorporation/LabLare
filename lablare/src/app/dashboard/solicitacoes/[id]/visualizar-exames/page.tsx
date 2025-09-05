'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { generateLabelHtml } from '@/utils/printTemplates/generateLabelHtml';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';

// Tipagens (mantidas como no seu código)
interface PacienteData {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  email?: string;
  sexo?: string;
}

interface ExameCatalogoData {
  nome_exame: string;
  origem: string;
}

interface ItemSolicitacaoData {
  id_item_solicitacao: number;
  exame_catalogo: ExameCatalogoData;
}

interface SolicitacaoExamesData {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  medico_solicitante?: string;
  status: string;
  paciente: PacienteData;
  recepcionista: {
    nome_completo: string;
  };
  itens_solicitacao: ItemSolicitacaoData[];
}

const calculateAge = (birthDateString: string): number => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export default function VisualizarExamesPage() {
  const router = useRouter();
  const params = useParams();
  const solicitacaoId = params.id as string;

  const [solicitacao, setSolicitacao] = useState<SolicitacaoExamesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [examesPardini, setExamesPardini] = useState<ItemSolicitacaoData[]>([]);
  const [examesLare, setExamesLare] = useState<ItemSolicitacaoData[]>([]);

  useEffect(() => {
    async function fetchSolicitacao() {
      if (!solicitacaoId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/solicitacoes/${solicitacaoId}`);
        if (!response.ok) {
          throw new Error('Falha ao buscar a solicitação.');
        }
        const data: SolicitacaoExamesData = await response.json();
        setSolicitacao(data);

        // CORREÇÃO: Converter a origem para minúsculas antes de comparar
        // Isso garante que o filtro funcione independentemente de ser 'PARDINI' ou 'pardini'.
        const pardini = data.itens_solicitacao.filter(
          (item) => item.exame_catalogo.origem?.toLowerCase() === 'pardini'
        );
        const lare = data.itens_solicitacao.filter(
          (item) => item.exame_catalogo.origem?.toLowerCase() === 'lare'
        );
        setExamesPardini(pardini);
        setExamesLare(lare);

      } catch (error: any) {
        toast.error(error.message);
        router.push('/dashboard/etiqueta');
      } finally {
        setLoading(false);
      }
    }
    fetchSolicitacao();
  }, [solicitacaoId, router]);

  const handlePrintEtiquetas = () => {
    if (!solicitacao) return;

    const labelsHtml = generateLabelHtml(
        solicitacao.paciente,
        calculateAge(solicitacao.paciente.data_nascimento),
        solicitacao.itens_solicitacao.map(item => item.exame_catalogo)
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Impressão de Etiquetas</title>
            <style>
              @page { size: auto; margin: 0mm; }
              body { margin: 0; font-family: sans-serif; }
              .etiqueta-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
                page-break-after: always;
              }
              .etiqueta {
                border: 1px solid #000;
                padding: 10px;
                width: 180px;
                height: 100px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                font-size: 10px;
                box-sizing: border-box;
              }
              .etiqueta h3 { margin: 0 0 5px 0; font-size: 12px; }
              .etiqueta p { margin: 0 0 2px 0; }
              .etiqueta .exames { font-size: 9px; margin-top: 5px; }

              @media print {
                body { margin: 0; padding: 0; }
                .etiqueta-container {
                  grid-template-columns: repeat(auto-fill, minmax(2in, 1fr));
                  gap: 0.25in;
                  padding: 0.5in;
                }
                .etiqueta {
                  width: 1.8in;
                  height: 0.9in;
                  border: 1px solid black;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            ${labelsHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
    }
  };

  const handleFillPardiniData = () => {
    alert('Funcionalidade "Preencher Dados Pardini" será implementada aqui.');
  };

  if (loading) {
    return <div className="text-center p-8 dark:text-gray-200">Carregando exames...</div>;
  }

  if (!solicitacao) {
    return <div className="text-center p-8 dark:text-gray-200">Nenhum exame encontrado para esta solicitação.</div>;
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 dark:bg-gray-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out">
          &larr; Voltar
        </button>
        <h1 className="text-3xl font-bold dark:text-gray-100">Exames da Solicitação #{solicitacao.id_solicitacao}</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <p className="text-lg text-gray-700 dark:text-gray-200"><strong>Paciente:</strong> {solicitacao.paciente.nome_completo}</p>
        <p className="text-lg text-gray-700 dark:text-gray-200"><strong>CPF:</strong> {formatCpfForDisplay(solicitacao.paciente.cpf)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Exames Lare</h2>
          {examesLare.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              {examesLare.map((item) => (
                <li key={item.id_item_solicitacao}>{item.exame_catalogo.nome_exame}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Nenhum exame Lare nesta solicitação.</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">Exames Pardini</h2>
          {examesPardini.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              {examesPardini.map((item) => (
                <li key={item.id_item_solicitacao}>{item.exame_catalogo.nome_exame}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Nenhum exame Pardini nesta solicitação.</p>
          )}
        </div>
      </div>

      <div className="flex justify-start gap-4 pt-4">
        {examesPardini.length > 0 && (
          <button
            onClick={handleFillPardiniData}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out">
            Preencher Dados Pardini
          </button>
        )}
        <button
          onClick={handlePrintEtiquetas}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out">
          Imprimir Etiquetas
        </button>
      </div>
    </div>
  );
}