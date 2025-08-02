// lablare/src/app/api/laudos/rejeitar/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

/**
 * Manipula requisições POST para rejeitar um laudo.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON indicando sucesso ou erro.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Biomédico'];
    const userProfile = session.user?.nome_perfil;
    const userId = Number(session.user?.id);

    if (!userProfile || !allowedProfiles.includes(userProfile) || isNaN(userId) || userId <= 0) {
      return NextResponse.json({ message: 'Acesso negado. Apenas Biomédicos ou Administradores podem rejeitar laudos.' }, { status: 403 });
    }

    const { id_laudo, motivo_rejeicao } = await req.json();

    if (!id_laudo || !motivo_rejeicao) {
      return NextResponse.json({ message: 'ID do laudo e motivo da rejeição são obrigatórios.' }, { status: 400 });
    }

    const parsedLaudoId = parseInt(id_laudo);
    if (isNaN(parsedLaudoId)) {
      return NextResponse.json({ message: 'ID do laudo inválido.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedLaudo = await tx.laudo.update({
        where: { id_laudo: parsedLaudoId },
        data: {
          status_laudo: 'Rejeitado',
          observacoes_biomedico: motivo_rejeicao,
          data_validacao: new Date(),
        },
        include: {
          item_solicitacao: true,
        },
      });

      await tx.itemSolicitacao.update({
        where: { id_item_solicitacao: updatedLaudo.id_item_solicitacao },
        data: { status_item: 'Recebida pela área técnica' },
      });

      return updatedLaudo;
    });

    return NextResponse.json({
      message: `Laudo #${result.id_laudo} rejeitado com sucesso e enviado para correção.`,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao rejeitar laudo:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Laudo não encontrado. Verifique o ID.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor ao rejeitar laudo.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
