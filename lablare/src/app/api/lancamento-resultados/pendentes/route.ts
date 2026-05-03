// lablare/src/app/api/lancamento-resultados/pendentes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { STATUS_ITEM } from '@/lib/statuses';

/**
 * Manipula requisições GET para listar itens de solicitação que estão com amostras recebidas
 * e pendentes de lançamento de resultados.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON contendo a lista de itens ou um erro.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verificação de Sessão e Permissão
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Técnico de Laboratório'];
    const userProfile = session.user?.nome_perfil;

    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para visualizar amostras pendentes de lançamento.' }, { status: 403 });
    }

    // 2. Busca ItemSolicitacao com status 'Amostra Recebida' e sem laudo associado
    const pendingItems = await prisma.itemSolicitacao.findMany({
      where: {
        status_item: STATUS_ITEM.AMOSTRA_RECEBIDA,
        laudo: null, // Garante que ainda não há um laudo (resultados não lançados)
      },
      orderBy: {
        solicitacao: {
          data_hora_solicitacao: 'asc', // Ordena pelas solicitações mais antigas primeiro
        },
      },
      include: {
        solicitacao: {
          select: {
            id_solicitacao: true,
            data_hora_solicitacao: true,
            paciente: {
              select: {
                nome_completo: true,
                cpf: true,
                data_nascimento: true, // Para exibir idade ou outros detalhes
              },
            },
          },
        },
        exame_catalogo: {
          select: {
            nome_exame: true,
            descricao: true,
            // Se o catálogo de exames tiver padrões de referência, inclua aqui.
            // Ex: parametros_referencia: true
          },
        },
      },
    });

    return NextResponse.json(pendingItems, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao buscar amostras pendentes de lançamento', error, { ctx: 'lancamento-resultados' });
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar amostras pendentes de lançamento.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  }
}