// lablare/src/app/api/amostras/recebimento/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js'; // Caminho ajustado
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Caminho ajustado

const prisma = new PrismaClient();

/**
 * Manipula requisições POST para registrar o recebimento de uma amostra.
 * Atualiza o status de um ItemSolicitacao para "Recebida pela área técnica".
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON indicando sucesso ou erro.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificação de Sessão e Permissão
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Técnico de Laboratório'];
    const userProfile = session.user?.nome_perfil;
    const userId = Number(session.user?.id);

    if (!userProfile || !allowedProfiles.includes(userProfile) || isNaN(userId) || userId <= 0) {
      return NextResponse.json({ message: 'Acesso negado. Apenas Técnicos de Laboratório ou Administradores podem registrar o recebimento de amostras.' }, { status: 403 });
    }

    const { id_item_solicitacao } = await req.json();

    if (!id_item_solicitacao) {
      return NextResponse.json({ message: 'ID do item de solicitação é obrigatório.' }, { status: 400 });
    }

    const parsedItemId = parseInt(id_item_solicitacao);
    if (isNaN(parsedItemId)) {
      return NextResponse.json({ message: 'ID do item de solicitação inválido.' }, { status: 400 });
    }

    // 2. Atualiza o status do ItemSolicitacao
    const updatedItem = await prisma.itemSolicitacao.update({
      where: { id_item_solicitacao: parsedItemId },
      data: {
        status_item: 'Recebida pela área técnica',
        // Você pode adicionar um campo para registrar quem recebeu e quando, se necessário
        // id_tecnico_recebimento: userId,
        // data_recebimento: new Date(),
      },
      include: { // Inclui dados para a resposta
        solicitacao: {
          select: {
            id_solicitacao: true,
            paciente: { select: { nome_completo: true } },
          },
        },
        exame_catalogo: { select: { nome_exame: true } },
      },
    });

    return NextResponse.json({
      message: `Amostra do exame "${updatedItem.exame_catalogo.nome_exame}" para o paciente "${updatedItem.solicitacao.paciente.nome_completo}" recebida com sucesso!`,
      item: updatedItem,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao registrar recebimento de amostra:', error);
    if (error.code === 'P2025') { // Prisma error for record not found
      return NextResponse.json({ message: 'Item de solicitação não encontrado. Verifique o ID.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor ao registrar recebimento de amostra.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
