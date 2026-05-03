// lablare/src/app/api/laudos/[id]/detalhes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Manipula requisições GET para buscar os detalhes completos de um laudo.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Biomédico'];
    const userProfile = session.user?.nome_perfil;

    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para visualizar laudos.' }, { status: 403 });
    }

    const { id } = await context.params;
    const laudoId = parseInt(id);

    if (isNaN(laudoId)) {
      return NextResponse.json({ message: 'ID do laudo inválido.' }, { status: 400 });
    }

    const laudoDetalhado = await prisma.laudo.findUnique({
      where: { id_laudo: laudoId },
      include: {
        parametros_resultado: true,
        item_solicitacao: {
          include: {
            exame_catalogo: true,
            solicitacao: {
              include: {
                paciente: true,
                recepcionista: { select: { nome_completo: true } },
              },
            },
          },
        },
        tecnico: { select: { nome_completo: true } },
        biomedico_validador: { select: { nome_completo: true } },
      },
    });

    if (!laudoDetalhado) {
      return NextResponse.json({ message: 'Laudo não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(laudoDetalhado, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao buscar detalhes do laudo', error, { ctx: 'laudos' });
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar detalhes do laudo.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  }
}
