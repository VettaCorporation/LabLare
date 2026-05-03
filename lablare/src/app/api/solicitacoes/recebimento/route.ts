// lablare/src/app/api/solicitacoes/recebimento/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { STATUS_ITEM } from '@/lib/statuses';

// --- MÉTODO POST ---
/**
 * Manipula a requisição POST para confirmar o recebimento de uma amostra.
 * Altera o status de um item de solicitação para 'Amostra Recebida'.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON indicando sucesso ou erro.
 */
export async function POST(req: NextRequest) {
  try {
    const { id_item_solicitacao } = await req.json();

    if (!id_item_solicitacao) {
      return NextResponse.json({ message: 'ID do item de solicitação é obrigatório.' }, { status: 400 });
    }

    const itemSolicitacao = await prisma.itemSolicitacao.findUnique({
      where: { id_item_solicitacao: parseInt(id_item_solicitacao) },
    });

    if (!itemSolicitacao) {
      return NextResponse.json({ message: 'Item de solicitação não encontrado.' }, { status: 404 });
    }

    // ADICIONADO: Verificação de status para evitar alterações indevidas
    if (itemSolicitacao.status_item !== STATUS_ITEM.AGUARDANDO_COLETA) {
      return NextResponse.json({ message: `Não é possível receber amostra. Status atual é: ${itemSolicitacao.status_item}.` }, { status: 400 });
    }

    // ADICIONADO: Lógica para atualizar o status do item de solicitação
    const resultado = await prisma.itemSolicitacao.update({
      where: { id_item_solicitacao: parseInt(id_item_solicitacao) },
      data: {
        status_item: STATUS_ITEM.AMOSTRA_RECEBIDA,
      },
      include: {
        solicitacao: {
          include: {
            paciente: true
          }
        },
        exame_catalogo: true,
      }
    });

    // Retorna a solicitação atualizada para o cliente
    return NextResponse.json({
      message: 'Amostra recebida e status atualizado com sucesso!',
      item: resultado,
    }, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao confirmar recebimento de amostra (legacy)', error, { ctx: 'solicitacoes' });
    return NextResponse.json({ message: 'Erro interno do servidor ao processar o recebimento.' }, { status: 500 });
  }
}