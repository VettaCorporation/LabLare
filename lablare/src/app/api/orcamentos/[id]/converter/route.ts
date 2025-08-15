import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

// POST: Converte um orçamento em uma solicitação de exames
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const recepcionistaId = Number(session?.user?.id);

    if (!recepcionistaId) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const id = parseInt(params.id);

    const orcamento = await prisma.orcamento.findUnique({
      where: { id_orcamento: id },
      include: { itens: true },
    });

    if (!orcamento || orcamento.status !== 'Pendente') {
      return NextResponse.json({ message: 'Orçamento não encontrado ou já processado.' }, { status: 404 });
    }

    // Transação para garantir consistência
    const novaSolicitacao = await prisma.$transaction(async (tx) => {
      // 1. Cria a nova solicitação
      const solicitacao = await tx.solicitacao.create({
        data: {
          id_paciente: orcamento.id_paciente,
          id_recepcionista: recepcionistaId,
          // Pode-se adicionar um campo "observacoes" no orçamento para passar para cá
          medico_solicitante: 'A partir de Orçamento #' + orcamento.id_orcamento,
        },
      });

      // 2. Cria os itens da solicitação baseados nos itens do orçamento
      await tx.itemSolicitacao.createMany({
        data: orcamento.itens.map(item => ({
          id_solicitacao: solicitacao.id_solicitacao,
          id_exame_catalogo: item.id_exame_catalogo,
        })),
      });

      // 3. Atualiza o status do orçamento para "Aprovado"
      await tx.orcamento.update({
        where: { id_orcamento: id },
        data: { status: 'Aprovado' },
      });

      return solicitacao;
    });

    return NextResponse.json({ message: `Orçamento convertido com sucesso! Nova solicitação #${novaSolicitacao.id_solicitacao} criada.`, solicitacao: novaSolicitacao }, { status: 200 });

  } catch (error) {
    console.error("Erro ao converter orçamento:", error);
    return NextResponse.json({ message: 'Erro interno ao converter o orçamento.' }, { status: 500 });
  }
}