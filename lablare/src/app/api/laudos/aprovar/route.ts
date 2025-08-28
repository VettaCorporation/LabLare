// lablare/src/app/api/laudos/aprovar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js'; // Ajuste o caminho conforme sua estrutura de pastas
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Ajuste o caminho

const prisma = new PrismaClient();

// --- MÉTODO POST ---
/**
 * Manipula a requisição POST para aprovar um laudo.
 * Atualiza o status do Laudo e do ItemSolicitacao associado para "Validado".
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

    // ALTERAÇÃO: Apenas o perfil de Administrador pode validar laudos
    const allowedProfiles = ['Administrador'];
    const userProfile = session.user?.nome_perfil;
    const userId = Number(session.user?.id); // ID do usuário logado (o Administrador)

    if (!userProfile || !allowedProfiles.includes(userProfile) || isNaN(userId) || userId <= 0) {
      return NextResponse.json({ message: 'Acesso negado. Apenas Administradores podem validar laudos.' }, { status: 403 });
    }

    const { id_laudo, observacoes_biomedico } = await req.json();

    // Validação básica
    if (!id_laudo) {
      return NextResponse.json({ message: 'ID do laudo é obrigatório.' }, { status: 400 });
    }

    const parsedLaudoId = parseInt(id_laudo);
    if (isNaN(parsedLaudoId)) {
      return NextResponse.json({ message: 'ID do laudo inválido.' }, { status: 400 });
    }

    // Inicia uma transação para garantir atomicidade
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Verifica se o Laudo existe e se está no status correto
      const laudo = await tx.laudo.findUnique({
        where: { id_laudo: parsedLaudoId },
        include: { item_solicitacao: true },
      });

      if (!laudo) {
        throw new Error('Laudo não encontrado.');
      }

      if (laudo.status_laudo !== 'Pendente de Validação') {
        throw new Error(`O laudo não pode ser validado. Status atual: "${laudo.status_laudo}".`);
      }

      // 2. Atualiza o registro de Laudo
      const updatedLaudo = await tx.laudo.update({
        where: { id_laudo: parsedLaudoId },
        data: {
          id_biomedico_validador: userId, // Associa o usuário (Administrador) que validou
          data_validacao: new Date(),
          observacoes_biomedico: observacoes_biomedico,
          status_laudo: 'Validado', // Altera o status para "Validado"
        },
      });

      // 3. Atualiza o status do ItemSolicitacao para 'Laudo Validado'
      await tx.itemSolicitacao.update({
        where: { id_item_solicitacao: laudo.id_item_solicitacao },
        data: { status_item: 'Laudo Validado' },
      });

      // Retorna o resultado esperado da transação
      return updatedLaudo;
    });

    return NextResponse.json({
      message: 'Laudo validado com sucesso!',
      laudoId: transactionResult.id_laudo,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao validar laudo:', error);
    // Erros lançados dentro da transação ou outros erros serão capturados aqui
    return NextResponse.json({ message: error.message || 'Erro interno do servidor ao validar laudo.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
