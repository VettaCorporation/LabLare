// Caminho: src/app/api/solicitacoes/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma'; // Use a instância centralizada

interface RouteParams {
    params: {
        id: string;
    }
}

// --- MÉTODO GET CORRIGIDO ---
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
    console.error(`Erro ao buscar solicitação:`, error); // Removido params.id para segurança no log
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// --- MÉTODO PUT PARA EDITAR ---
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

        const { examesSelecionados } = await req.json();
        if (!examesSelecionados || !Array.isArray(examesSelecionados)) {
            return NextResponse.json({ message: 'Lista de exames inválida.' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.itemSolicitacao.deleteMany({
                where: { id_solicitacao: solicitacaoId },
            });

            if (examesSelecionados.length > 0) {
                const novosItensData = examesSelecionados.map((exame: { id_exame_catalogo: number }) => ({
                    id_solicitacao: solicitacaoId,
                    id_exame_catalogo: exame.id_exame_catalogo,
                }));
                await tx.itemSolicitacao.createMany({
                    data: novosItensData,
                });
            }
        });

        return NextResponse.json({ message: 'Solicitação atualizada com sucesso!' }, { status: 200 });

    } catch (error: any) {
        console.error(`Erro ao atualizar solicitação ${params.id}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}