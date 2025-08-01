// lablare/src/app/api/laudos/aprovar/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js'; // Caminho ajustado
import { getServerSession } from 'next-auth';
// CORREÇÃO AQUI: O caminho correto para o arquivo de autenticação
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

/**
 * Manipula requisições POST para aprovar um laudo.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON indicando sucesso ou erro.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificação de Sessão e Permissão (Apenas Biomédico ou Administrador)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Biomédico'];
    const userProfile = session.user?.nome_perfil;
    const userId = Number(session.user?.id); // ID do Biomédico logado

    if (!userProfile || !allowedProfiles.includes(userProfile) || isNaN(userId) || userId <= 0) {
      return NextResponse.json({ message: 'Acesso negado. Apenas Biomédicos ou Administradores podem aprovar laudos.' }, { status: 403 });
    }

    const { id_laudo } = await req.json();

    if (!id_laudo) {
      return NextResponse.json({ message: 'ID do laudo é obrigatório.' }, { status: 400 });
    }

    const parsedLaudoId = parseInt(id_laudo);
    if (isNaN(parsedLaudoId)) {
      return NextResponse.json({ message: 'ID do laudo inválido.' }, { status: 400 });
    }

    // 2. Atualiza o status do Laudo para 'Liberado'
    const updatedLaudo = await prisma.laudo.update({
      where: { id_laudo: parsedLaudoId },
      data: {
        status_laudo: 'Liberado',
        id_biomedico_validador: userId, // Assinatura eletrônica
        data_validacao: new Date(),
      },
      include: {
        item_solicitacao: {
          include: {
            solicitacao: {
              select: {
                paciente: { select: { nome_completo: true } },
              },
            },
            exame_catalogo: { select: { nome_exame: true } },
          },
        },
      },
    });

    return NextResponse.json({
      message: `Laudo do exame "${updatedLaudo.item_solicitacao.exame_catalogo.nome_exame}" para o paciente "${updatedLaudo.item_solicitacao.solicitacao.paciente.nome_completo}" aprovado com sucesso!`,
      laudo: updatedLaudo,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao aprovar laudo:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Laudo não encontrado. Verifique o ID.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor ao aprovar laudo.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
