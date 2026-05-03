// lablare/src/app/api/laudos/pendentes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { STATUS_LAUDO } from '@/lib/statuses';

/**
 * Manipula requisições GET para listar laudos com status "Pendente de Validação".
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON contendo a lista de laudos ou um erro.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Biomédico'];
    const userProfile = session.user?.nome_perfil;

    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para visualizar laudos pendentes.' }, { status: 403 });
    }

    const pendingLaudos = await prisma.laudo.findMany({
      where: {
        status_laudo: STATUS_LAUDO.PENDENTE_VALIDACAO,
      },
      orderBy: {
        data_lancamento: 'asc',
      },
      include: {
        item_solicitacao: {
          select: {
            solicitacao: {
              select: {
                id_solicitacao: true,
                data_hora_solicitacao: true,
                paciente: {
                  select: {
                    nome_completo: true,
                    cpf: true,
                  },
                },
              },
            },
            exame_catalogo: {
              select: {
                nome_exame: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(pendingLaudos, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao buscar laudos pendentes', error, { ctx: 'laudos' });
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar laudos pendentes.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  }
}
