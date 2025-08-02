// lablare/src/app/api/laudos/[id]/detalhes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma/index.js'; // Caminho ajustado
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

/**
 * Manipula requisições GET para buscar os detalhes completos de um laudo.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @param {object} context - Objeto de contexto contendo os parâmetros da rota.
 * @param {object} context.params - Parâmetros dinâmicos da rota.
 * @param {string} context.params.id - O ID do laudo a ser buscado.
 * @returns {NextResponse} Uma resposta JSON contendo o laudo completo ou um erro.
 */
export async function GET(req: NextRequest, context: { params: { id: string } }) {
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

    const laudoId = parseInt(context.params.id);

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
    console.error('Erro ao buscar detalhes do laudo:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar detalhes do laudo.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
