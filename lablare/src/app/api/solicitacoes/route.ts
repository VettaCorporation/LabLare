// src/app/api/solicitacoes/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma'; 
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createNotification } from '@/utils/notification'; 

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        const userIdFromSession = (session?.user as any)?.id_usuario || (session?.user as any)?.id;
        const idUsuarioLogado = parseInt(userIdFromSession?.toString() || '0', 10); 
        
        if (!session || idUsuarioLogado === 0) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');
        const idFilter = searchParams.get('id');
        const pacienteFilter = searchParams.get('paciente');
        const solicitanteFilter = searchParams.get('solicitante');
        const minhasSolicitacoes = searchParams.get('minhas'); 

        let whereCondition: any = {};

        if (minhasSolicitacoes === 'true') {
            whereCondition.id_recepcionista = idUsuarioLogado;
        }

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
                        cpf: true,
                    }
                },
                recepcionista: { select: { nome_completo: true } },
                aprovador: { select: { nome_completo: true } },
                itens_solicitacao: {
                    select: {
                        // *** CORREÇÃO AQUI: INCLUIR O ID DO ITEM DA SOLICITAÇÃO ***
                        id_item_solicitacao: true,
                        // -----------------------------------------------------
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


export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }
        const userPrivileges = (session.user as any)?.privilegios || [];
        const userProfile = (session.user as any)?.nome_perfil;
        
        const isAdmin = userProfile === 'Administrador';
        const hasSolicitarPrivilege = userPrivileges.includes('/dashboard/solicitar-exame');
        
        if (!isAdmin && !hasSolicitarPrivilege) {
            return NextResponse.json({ message: 'Acesso negado para criar solicitações.' }, { status: 403 });
        }
        
        const body = await req.json();
        const { pacienteId, examesSelecionados, medico_solicitante } = body;

        if (!pacienteId || !examesSelecionados || examesSelecionados.length === 0) {
            return NextResponse.json({ message: 'Dados de solicitação inválidos.' }, { status: 400 });
        }

        const userIdFromSession = (session.user as any)?.id_usuario || (session.user as any)?.id;
        const id_usuario_recepcionista = parseInt(userIdFromSession?.toString() || '0', 10); 
        
        if (isNaN(id_usuario_recepcionista) || id_usuario_recepcionista === 0) {
             return NextResponse.json({ message: 'ID do recepcionista inválido na sessão. Tente logar novamente.' }, { status: 400 });
        }

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
        
        // *** CORREÇÃO: Busca do Aprovador em Duas Etapas para Robustez ***
        const perfilAdmin = await prisma.perfil.findUnique({
            where: { nome_perfil: 'Administrador' },
            select: { id_perfil: true }
        });

        const idPerfilAdmin = perfilAdmin?.id_perfil || 0;
        let idAprovador: number | null = null;
        
        if (idPerfilAdmin > 0) {
             const aprovador = await prisma.usuario.findFirst({
                where: { id_perfil: idPerfilAdmin },
                select: { id_usuario: true }
            });
            idAprovador = aprovador?.id_usuario || null;
        }
        // ----------------------------------------------------------------

        const novaSolicitacao = await prisma.solicitacao.create({
            data: {
                paciente: {
                    connect: { id_paciente: pacienteId }
                },
                recepcionista: {
                    connect: { id_usuario: id_usuario_recepcionista }
                },
                aprovador: idAprovador ? {
                    connect: { id_usuario: idAprovador }
                } : undefined, 
                
                medico_solicitante: medico_solicitante,
                status: 'AGUARDANDO_APROVACAO', 
                itens_solicitacao: {
                    create: examesComPreco.map((exame) => ({
                        id_exame_catalogo: exame.id_exame_catalogo,
                        preco_item: exame.preco,
                        desconto_item: 0, 
                    })),
                },
            },
            include: {
                itens_solicitacao: true,
            },
        });
        
        // DISPARO DE NOTIFICAÇÕES
        if (idAprovador) {
            await createNotification(
                idAprovador,
                `Nova Solicitação #${novaSolicitacao.id_solicitacao} aguarda aprovação.`,
                `/dashboard/aprovar-solicitacoes?id=${novaSolicitacao.id_solicitacao}`
            );
        }

        await createNotification(
            id_usuario_recepcionista,
            `Solicitação #${novaSolicitacao.id_solicitacao} foi criada com sucesso.`,
            `/dashboard/pedidos?id=${novaSolicitacao.id_solicitacao}`
        );

        return NextResponse.json(novaSolicitacao, { status: 201 });

    } catch (error: any) {
        console.error('Erro ao criar solicitação:', error);
        return NextResponse.json({ message: 'Erro interno do servidor ao criar a solicitação.' }, { status: 500 });
    }
}