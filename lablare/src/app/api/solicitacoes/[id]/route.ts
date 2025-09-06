import { NextResponse, NextRequest } from 'next/server';
<<<<<<< HEAD
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
=======
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
>>>>>>> main
            return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
        }

        const solicitacao = await prisma.solicitacao.findUnique({
            where: { id_solicitacao: id },
            include: {
                paciente: {
                    select: { nome_completo: true }
                },
                recepcionista: {
                    select: { nome_completo: true }
                },
                aprovador: { // Incluindo o aprovador na busca
                    select: { nome_completo: true }
                },
                itens_solicitacao: {
                    select: {
                        id_item_solicitacao: true,
                        exame_catalogo: {
                            select: {
                                id_exame_catalogo: true,
                                nome_exame: true,
                                preco: true,
                                origem: true,
                            }
                        }
                    }
                }
            }
        });

        if (!solicitacao) {
            return NextResponse.json({ message: 'Solicitação não encontrada.' }, { status: 404 });
        }

<<<<<<< HEAD
        return NextResponse.json(solicitacao);
    } catch (error) {
        console.error('Erro ao buscar detalhes da solicitação:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
=======
    } catch (error: any) {
        console.error(`Erro ao atualizar solicitação ${params.id}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
>>>>>>> main
    }
}