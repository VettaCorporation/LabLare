import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: Busca os detalhes de um único orçamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const id = parseInt((await params).id);
    const orcamento = await prisma.orcamento.findUnique({
      where: { id_orcamento: id },
      include: {
        paciente: true,
        recepcionista: { select: { nome_completo: true } },
        itens: { include: { exame_catalogo: true } },
      },
    });

    if (!orcamento) {
      return NextResponse.json({ message: 'Orçamento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(orcamento, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar detalhes do orçamento.' }, { status: 500 });
  }
}

// DELETE: Exclui um orçamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const id = parseInt((await params).id);

    // Deleta em uma transação para garantir que os itens e o orçamento sejam removidos juntos
    await prisma.$transaction(async (tx) => {
      await tx.orcamentoItem.deleteMany({
        where: { id_orcamento: id },
      });
      await tx.orcamento.delete({
        where: { id_orcamento: id },
      });
    });

    return NextResponse.json({ message: 'Orçamento excluído com sucesso!' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir o orçamento.' }, { status: 500 });
  }
}