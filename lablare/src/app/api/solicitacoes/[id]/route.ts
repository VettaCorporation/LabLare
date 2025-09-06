import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
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

        return NextResponse.json(solicitacao);
    } catch (error) {
        console.error('Erro ao buscar detalhes da solicitação:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}