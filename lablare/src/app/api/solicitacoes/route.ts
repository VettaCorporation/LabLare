import { NextResponse, NextRequest } from 'next/server';
import { SolicitacaoStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma'; // Usando o cliente centralizado

// GET: Lista solicitações com filtro de status
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');
        const idFilter = searchParams.get('id');
        const pacienteFilter = searchParams.get('paciente');
        const solicitanteFilter = searchParams.get('solicitante');

        let whereCondition: any = {};
        if (statusFilter) {
            whereCondition.status = statusFilter;
        }
        if (idFilter) {
            whereCondition.id_solicitacao = parseInt(idFilter, 10);
        }
        if (pacienteFilter) {
            whereCondition.paciente = {
                nome_completo: {
                    contains: pacienteFilter,
                },
            };
        }
        if (solicitanteFilter) {
            whereCondition.recepcionista = {
                nome_completo: {
                    contains: solicitanteFilter,
                },
            };
        }

        const solicitacoes = await prisma.solicitacao.findMany({
            where: whereCondition,
            include: {
                paciente: { 
                    select: { 
                        nome_completo: true,
                        cpf: true, // <-- AQUI FOI ADICIONADO O CPF
                    } 
                },
                recepcionista: { select: { nome_completo: true } },
                aprovador: { select: { nome_completo: true } },
                itens_solicitacao: {
                    select: {
                        exame_catalogo: {
                            select: { nome_exame: true, preco: true },
                        },
                    },
                },
            },
            orderBy: { data_hora_solicitacao: 'desc' },
        });

        return NextResponse.json(solicitacoes, { status: 200 });

    } catch (error: any) {
        console.error('Erro ao buscar solicitações:', error);
        return NextResponse.json({ message: 'Erro interno do servidor ao buscar solicitações.' }, { status: 500 });
    }
}

// POST: Cria uma nova solicitação de exame
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }
        
        const body = await req.json();
        const { pacienteId, examesSelecionados, medico_solicitante } = body;
        
        if (!pacienteId || !examesSelecionados || examesSelecionados.length === 0) {
            return NextResponse.json({ message: 'Dados de solicitação inválidos.' }, { status: 400 });
        }
        
        const id_usuario_recepcionista = Number(session.user?.id);

        const idsExames = examesSelecionados.map((exame: { id_exame_catalogo: number }) => exame.id_exame_catalogo);
        
        const examesComPreco = await prisma.exameCatalogo.findMany({
            where: {
                id_exame_catalogo: {
                    in: idsExames,
                },
            },
            select: {
                id_exame_catalogo: true,
                preco: true,
            },
        });
        
        const novaSolicitacao = await prisma.solicitacao.create({
            data: {
                id_paciente: pacienteId,
                id_recepcionista: id_usuario_recepcionista,
                medico_solicitante: medico_solicitante,
                status: SolicitacaoStatus.AGUARDANDO_APROVACAO,
                itens_solicitacao: {
                    create: examesComPreco.map((exame) => ({
                        id_exame_catalogo: exame.id_exame_catalogo,
                        preco_item: exame.preco,
                    })),
                },
            },
            include: {
                itens_solicitacao: true,
            },
        });

        return NextResponse.json(novaSolicitacao, { status: 201 });
        
    } catch (error: any) {
        console.error('Erro ao criar solicitação:', error);
        return NextResponse.json({ message: 'Erro interno do servidor ao criar a solicitação.' }, { status: 500 });
    }
}
