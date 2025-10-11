import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { SolicitacaoStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    // Extrai o ID da URL da requisição
    const id = req.url.split('/').pop();
    if (!id) {
        return NextResponse.json({ message: 'ID da solicitação não fornecido.' }, { status: 400 });
    }
    const solicitacaoId = parseInt(id, 10);
    
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

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }
    
    // Extrai o ID da URL da requisição
    const id = req.url.split('/').pop();
    if (!id) {
        return NextResponse.json({ message: 'ID da solicitação não fornecido.' }, { status: 400 });
    }
    const solicitacaoId = parseInt(id, 10);
    
    if (isNaN(solicitacaoId)) {
      return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }

    const { examesSelecionados, desconto_percentual, valor_final, novoStatus, aprovadorId } = await req.json();

    await prisma.$transaction(async (prismaTx) => {
        if (novoStatus === 'AGUARDANDO_COLETA') {
            await prismaTx.solicitacao.update({
                where: { id_solicitacao: solicitacaoId },
                data: {
                    status: SolicitacaoStatus.AGUARDANDO_COLETA,
                    id_aprovador: aprovadorId,
                }
            });
        } else {
            await prismaTx.itemSolicitacao.deleteMany({
                where: { id_solicitacao: solicitacaoId },
            });

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

            await prismaTx.solicitacao.update({
                where: { id_solicitacao: solicitacaoId },
                data: {
                    desconto_percentual,
                    valor_final,
                }
            });
        }
    });

    return NextResponse.json({ message: 'Solicitação atualizada com sucesso.' }, { status: 200 });

  } catch (error: any) {
    console.error(`Erro ao atualizar solicitação:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}