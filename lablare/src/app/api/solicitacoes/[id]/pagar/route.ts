// Caminho: src/app/api/solicitacoes/[id]/pagar/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateLabelHtml } from '../../../../../utils/printTemplates/generateLabelHtml';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { parseJson } from '@/lib/schemas/common';
import { pagarSolicitacaoSchema } from '@/lib/schemas/solicitacoes';

// --- MÉTODO POST para registrar o pagamento de uma solicitação ---
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const solicitacaoId = parseInt((await params).id, 10);

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    if (isNaN(solicitacaoId)) {
        return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }

    // Aceita apenas tipo_atendimento e forma_pagamento do client. valor_pago
    // é AUTORITATIVO do backend: vem de Solicitacao.valor_final (gravado na
    // aprovação). Cliente não pode subvalorizar pagamento.
    const parsed = await parseJson(req, pagarSolicitacaoSchema);
    if (!parsed.ok) return parsed.response;
    const { tipo_atendimento, forma_pagamento } = parsed.data;

    // Usa uma transação para garantir consistência
    const solicitacaoPaga = await prisma.$transaction(async (tx) => {
        const solicitacao = await tx.solicitacao.findUnique({
            where: { id_solicitacao: solicitacaoId },
            include: { itens_solicitacao: { select: { preco_item: true } } },
        });

        if (!solicitacao) {
            throw new Error('Solicitação não encontrada.');
        }

        // VERIFICAÇÃO CRÍTICA: Status deve ser AGUARDANDO_PAGAMENTO.
        // Usamos a string literal para maior segurança em runtime.
        if (solicitacao.status !== 'AGUARDANDO_PAGAMENTO') {
            // Se já está AGUARDANDO_COLETA ou superior, ignora e segue o fluxo para gerar a etiqueta.
            if (solicitacao.status === 'AGUARDANDO_COLETA' || solicitacao.status === 'LAUDO_VALIDADO') {
                return solicitacao;
            }
            throw new Error(`Esta solicitação não está aguardando pagamento. Status atual: ${solicitacao.status}`);
        }

        // valor_pago é determinado pelo backend, NUNCA pelo client.
        // Preferimos o valor_final gravado na aprovação. Caso esteja ausente
        // (não deveria pós-aprovação), recomputamos a partir dos itens.
        let valorPagoCalculado: number;
        if (solicitacao.valor_final !== null && solicitacao.valor_final !== undefined) {
            valorPagoCalculado = Number(solicitacao.valor_final);
        } else {
            valorPagoCalculado = solicitacao.itens_solicitacao.reduce(
                (acc, item) => acc + Number(item.preco_item),
                0,
            );
            valorPagoCalculado = Number(valorPagoCalculado.toFixed(2));
        }

        // 1. Atualiza a solicitação para o status AGUARDANDO_COLETA (STATUS PAGO/PRONTO)
        const updatedSolicitacao = await tx.solicitacao.update({
            where: { id_solicitacao: solicitacaoId },
            data: {
                status: 'AGUARDANDO_COLETA',
            },
        });

        // 2. Cria o registro de pagamento com valor autoritativo
        await tx.pagamento.create({
            data: {
                id_solicitacao: solicitacaoId,
                tipo_atendimento,
                forma_pagamento,
                valor_pago: valorPagoCalculado,
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
    logger.error('Erro ao processar pagamento de solicitação', error, { ctx: 'solicitacoes', solicitacaoId });
    return NextResponse.json({ message: error?.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
