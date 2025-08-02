// lablare/src/app/api/solicitacoes/recebimento/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js'; // Caminho ajustado
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Caminho ajustado

const prisma = new PrismaClient();

/**
 * Manipula requisições POST para registrar o recebimento de uma solicitação completa.
 * Atualiza o status de todos os ItemSolicitacao associados.
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
      return NextResponse.json({ message: 'Acesso negado. Apenas Técnicos de Laboratório ou Administradores podem registrar o recebimento de solicitações.' }, { status: 403 });
    }

    const { id_solicitacao } = await req.json();

    if (!id_solicitacao) {
      return NextResponse.json({ message: 'ID da solicitação é obrigatório.' }, { status: 400 });
    }

    const parsedSolicitacaoId = parseInt(id_solicitacao);
    if (isNaN(parsedSolicitacaoId)) {
      return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }

    // Inicia uma transação para garantir que a operação seja atômica
    const result = await prisma.$transaction(async (tx) => {
      // 2. Busca a solicitação para verificar sua existência e seus itens
      const solicitacao = await tx.solicitacao.findUnique({
        where: { id_solicitacao: parsedSolicitacaoId },
        include: {
          itens_solicitacao: true,
          paciente: { select: { nome_completo: true } },
        },
      });

      if (!solicitacao) {
        throw new Error('Solicitação não encontrada.');
      }

      // 3. Atualiza o status de TODOS os ItemSolicitacao associados
      const updatedItems = await tx.itemSolicitacao.updateMany({
        where: { id_solicitacao: parsedSolicitacaoId, status_item: 'Aguardando Coleta' },
        data: {
          status_item: 'Recebida pela área técnica',
          // Você pode adicionar um campo 'id_tecnico_recebimento' no schema para registrar
        },
      });

      if (updatedItems.count === 0) {
        throw new Error('Nenhum item de solicitação encontrado para este ID ou já foi recebido.');
      }

      // Retorna o resumo da operação
      return { solicitacao, updatedItemsCount: updatedItems.count };
    });

    return NextResponse.json({
      message: `Recebimento da solicitação #${result.solicitacao.id_solicitacao} para o paciente "${result.solicitacao.paciente.nome_completo}" registrado com sucesso. ${result.updatedItemsCount} amostras marcadas como recebidas.`,
      solicitacaoId: result.solicitacao.id_solicitacao,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao registrar recebimento de solicitação:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Solicitação não encontrada. Verifique o ID.' }, { status: 404 });
    }
    return NextResponse.json({ message: error.message || 'Erro interno do servidor ao registrar recebimento de amostra.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
