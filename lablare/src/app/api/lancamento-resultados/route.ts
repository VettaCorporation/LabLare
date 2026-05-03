// src/app/api/lancamento-resultados/route.ts
//
// Lançamento de resultado de exame por técnico ou admin.
//
// Recebe um id_item_solicitacao, um array de parâmetros e observações,
// e cria o Laudo + ParametroResultado em transação. Atualiza o
// status_item para "Recebida pela área técnica" e, quando todos os itens
// da solicitação têm laudo, promove a Solicitacao para AGUARDANDO_LAUDO.
//
// Histórico: este arquivo continha lógica de pagamento (rota legacy
// duplicada de /api/solicitacoes/[id]/pagar). A página
// /dashboard/lancamento-resultados sempre enviou payload de lançamento,
// então a rota anterior estava efetivamente quebrada — o POST falhava
// com "Dados de pagamento são obrigatórios". Reescrita em 2026-05.

import { NextRequest, NextResponse } from 'next/server';
import { SolicitacaoStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { parseJson } from '@/lib/schemas/common';
import { lancarResultadoSchema } from '@/lib/schemas/laudos';
import { STATUS_ITEM, STATUS_LAUDO } from '@/lib/statuses';
import { registrarLog, ACAO_LOG } from '@/lib/logService';

const ALLOWED_PROFILES = ['Administrador', 'Técnico de Laboratório'];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const userProfile = session.user.nome_perfil;
    if (!userProfile || !ALLOWED_PROFILES.includes(userProfile)) {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas Administrador ou Técnico podem lançar resultados.' },
        { status: 403 },
      );
    }

    const parsed = await parseJson(req, lancarResultadoSchema);
    if (!parsed.ok) return parsed.response;
    const { id_item_solicitacao, resultados, observacoes_tecnico } = parsed.data;

    const idTecnico = parseInt(session.user.id, 10);

    const { laudoId, solicitacaoStatusFinal } = await prisma.$transaction(async (tx) => {
      const item = await tx.itemSolicitacao.findUnique({
        where: { id_item_solicitacao },
        include: { laudo: { select: { id_laudo: true } } },
      });

      if (!item) {
        throw new Error('Item de solicitação não encontrado.');
      }

      if (item.status_item !== STATUS_ITEM.AMOSTRA_RECEBIDA) {
        throw new Error(
          `Este item não está pronto para lançamento. Status atual: "${item.status_item}". ` +
          `Esperado: "${STATUS_ITEM.AMOSTRA_RECEBIDA}".`,
        );
      }

      if (item.laudo) {
        throw new Error('Este item já possui um laudo lançado.');
      }

      const laudo = await tx.laudo.create({
        data: {
          id_item_solicitacao,
          id_tecnico: idTecnico,
          status_laudo: STATUS_LAUDO.PENDENTE_VALIDACAO,
          data_lancamento: new Date(),
          observacoes_tecnico: observacoes_tecnico ?? null,
          parametros_resultado: {
            create: resultados.map((r) => ({
              nome_parametro: r.nome_parametro,
              valor_resultado: r.valor_resultado,
              unidade_medida: r.unidade_medida ?? null,
              valores_referencia: r.valores_referencia ?? null,
            })),
          },
        },
        select: { id_laudo: true, id_item_solicitacao: true },
      });

      await tx.itemSolicitacao.update({
        where: { id_item_solicitacao },
        data: { status_item: STATUS_ITEM.RECEBIDA_AREA_TECNICA },
      });

      // Se todos os itens da solicitação já têm laudo, promove
      // Solicitacao para AGUARDANDO_LAUDO (espera validação biomédico).
      const itensRestantes = await tx.itemSolicitacao.count({
        where: {
          id_solicitacao: item.id_solicitacao,
          laudo: { is: null },
        },
      });

      let solicitacaoStatus: SolicitacaoStatus | null = null;
      if (itensRestantes === 0) {
        const updated = await tx.solicitacao.update({
          where: { id_solicitacao: item.id_solicitacao },
          data: { status: SolicitacaoStatus.AGUARDANDO_LAUDO },
          select: { status: true },
        });
        solicitacaoStatus = updated.status;
      }

      return { laudoId: laudo.id_laudo, solicitacaoStatusFinal: solicitacaoStatus };
    });

    await registrarLog(
      idTecnico,
      ACAO_LOG.LAUDO_LANCADO,
      `Laudo ${laudoId} lançado para item ${id_item_solicitacao} (${resultados.length} parâmetros).`,
    );

    return NextResponse.json(
      {
        message: 'Resultado lançado com sucesso. Aguardando validação do biomédico.',
        id_laudo: laudoId,
        solicitacao_status: solicitacaoStatusFinal,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
    logger.error('Erro ao lançar resultado de exame', error, { ctx: 'lancamento-resultados' });
    // Erros de validação de domínio (status errado, item não existe etc) são
    // mensagens curtas seguras para devolver. Erros realmente internos do
    // Prisma vão para o log; aqui devolvemos a mensagem do throw.
    return NextResponse.json({ message }, { status: 400 });
  }
}
