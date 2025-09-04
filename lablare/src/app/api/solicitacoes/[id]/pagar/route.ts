// Caminho: src/app/api/solicitacoes/[id]/pagar/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { SolicitacaoStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { generateLabelHtml } from '../../../../../utils/printTemplates/generateLabelHtml';
import prisma from '@/lib/prisma'; // Use a instância centralizada

// --- MÉTODO POST para registrar o pagamento de uma solicitação ---
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    const solicitacaoId = parseInt(params.id, 10);
    if (isNaN(solicitacaoId)) {
        return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }
    
    const { tipo_atendimento, forma_pagamento, valor_pago } = await req.json();
    if (!tipo_atendimento || !forma_pagamento || valor_pago === undefined) {
        return NextResponse.json({ message: 'Dados de pagamento são obrigatórios.' }, { status: 400 });
    }

    // Usa uma transação para garantir que a atualização e a criação do pagamento ocorram juntas
    const solicitacaoPaga = await prisma.$transaction(async (tx) => {
        const solicitacao = await tx.solicitacao.findUnique({
            where: { id_solicitacao: solicitacaoId },
        });

        if (!solicitacao) {
            throw new Error('Solicitação não encontrada.');
        }

        if (solicitacao.status !== SolicitacaoStatus.AGUARDANDO_PAGAMENTO) {
            throw new Error('Esta solicitação não está aguardando pagamento.');
        }

        // 1. Atualiza a solicitação para o status final de coleta
        const updatedSolicitacao = await tx.solicitacao.update({
            where: { id_solicitacao: solicitacaoId },
            data: {
                status: SolicitacaoStatus.AGUARDANDO_COLETA,
            },
        });

        // 2. Cria o registro de pagamento
        await tx.pagamento.create({
            data: {
                id_solicitacao: solicitacaoId,
                tipo_atendimento,
                forma_pagamento,
                valor_pago,
            }
        });

        return updatedSolicitacao;
    });

    // 3. Após o pagamento, gera a etiqueta de coleta
    const solicitacaoCompleta = await prisma.solicitacao.findUnique({
        where: { id_solicitacao: solicitacaoId },
        include: {
            paciente: true,
            itens_solicitacao: { include: { exame_catalogo: true } },
        }
    });

    if (!solicitacaoCompleta) {
        throw new Error('Erro ao buscar dados completos da solicitação para gerar etiqueta.');
    }
    
    const calculateAge = (birthdate: Date): number => {
        const today = new Date();
        let age = today.getFullYear() - birthdate.getFullYear();
        const m = today.getMonth() - birthdate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
            age--;
        }
        return age;
    };

    const idadePaciente = calculateAge(solicitacaoCompleta.paciente.data_nascimento);
    const examesParaEtiqueta = solicitacaoCompleta.itens_solicitacao.map(item => ({
        nome_exame: item.exame_catalogo.nome_exame,
    }));
    const etiquetaHtml = generateLabelHtml(solicitacaoCompleta.paciente, idadePaciente, examesParaEtiqueta);


    return NextResponse.json({ 
        message: 'Pagamento registrado e solicitação liberada para coleta!',
        solicitacao: solicitacaoPaga,
        etiquetaHtml: etiquetaHtml
    }, { status: 200 });

  } catch (error: any) {
    console.error(`Erro ao processar pagamento da solicitação ${params.id}:`, error.message);
    // Retorna a mensagem de erro específica para o frontend (ex: "Solicitação não encontrada.")
    return NextResponse.json({ message: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}