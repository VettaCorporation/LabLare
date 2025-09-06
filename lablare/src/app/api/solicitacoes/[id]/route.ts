import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const solicitacaoId = parseInt(params.id, 10);
    if (isNaN(solicitacaoId)) {
      return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }

    const solicitacao = await prisma.solicitacao.findUnique({
      where: { id_solicitacao: solicitacaoId },
      include: {
        paciente: true,
        recepcionista: { select: { nome_completo: true } },
        aprovador: { select: { nome_completo: true } },
        itens_solicitacao: {
          include: {
            exame_catalogo: true,
          },
        },
        pagamentos: true,
      },
    });

    if (!solicitacao) {
      return NextResponse.json({ message: 'Solicitação não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(solicitacao, { status: 200 });

  } catch (error: any) {
    console.error(`Erro ao buscar solicitação:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }
    
    const solicitacaoId = parseInt(params.id, 10);
    if (isNaN(solicitacaoId)) {
      return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }

    const { examesSelecionados, desconto_percentual, valor_final } = await req.json();

    await prisma.$transaction(async (prismaTx) => {
        // 1. Deletar os itens de solicitação antigos
        await prismaTx.itemSolicitacao.deleteMany({
            where: { id_solicitacao: solicitacaoId },
        });

        // 2. Criar os novos itens de solicitação
        const novosItens = await Promise.all(
            examesSelecionados.map(async (exame: { id_exame_catalogo: number }) => {
                const exameCatalogo = await prismaTx.exameCatalogo.findUnique({
                    where: { id_exame_catalogo: exame.id_exame_catalogo },
                    select: { preco: true }
                });

                return prismaTx.itemSolicitacao.create({
                    data: {
                        id_solicitacao: solicitacaoId,
                        id_exame_catalogo: exame.id_exame_catalogo,
                        preco_item: exameCatalogo?.preco ?? 0
                    }
                });
            })
        );

        // 3. Atualizar a solicitação com o novo desconto e valor final
        await prismaTx.solicitacao.update({
            where: { id_solicitacao: solicitacaoId },
            data: {
                desconto_percentual,
                valor_final,
            }
        });
    });

    return NextResponse.json({ message: 'Solicitação atualizada com sucesso.' }, { status: 200 });

  } catch (error: any) {
    console.error(`Erro ao atualizar solicitação ${params.id}:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
