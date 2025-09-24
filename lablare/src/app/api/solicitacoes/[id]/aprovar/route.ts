// src/app/api/solicitacoes/[id]/aprovar/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { SolicitacaoStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface AprovarRouteParams {
    params: { id: string };
}

export async function POST(req: NextRequest, { params }: AprovarRouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }

        const userProfile = (session.user as any).nome_perfil;
        const userPrivileges = (session.user as any)?.privilegios || [];
        const hasApprovalPrivilege = userPrivileges.includes('/dashboard/aprovar-solicitacoes');

        if (userProfile !== 'Administrador' && !hasApprovalPrivilege) {
            return NextResponse.json({ message: 'Acesso negado. Você não tem permissão para aprovar solicitações.' }, { status: 403 });
        }

        const solicitacaoId = parseInt(params.id, 10);
        if (isNaN(solicitacaoId)) {
            return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
        }

        const { desconto_percentual, valor_final } = await req.json();
        const aprovadorId = Number((session.user as any).id);

        const solicitacaoExistente = await prisma.solicitacao.findUnique({
            where: { id_solicitacao: solicitacaoId },
        });

        if (!solicitacaoExistente) {
            return NextResponse.json({ message: 'Solicitação não encontrada.' }, { status: 404 });
        }
        if (solicitacaoExistente.status !== SolicitacaoStatus.AGUARDANDO_APROVACAO) {
            return NextResponse.json({ message: 'Esta solicitação não pode mais ser aprovada.' }, { status: 409 });
        }

        const solicitacaoAprovada = await prisma.solicitacao.update({
            where: { id_solicitacao: solicitacaoId },
            data: {
                status: SolicitacaoStatus.AGUARDANDO_PAGAMENTO,
                id_aprovador: aprovadorId,
                desconto_percentual: desconto_percentual,
                valor_final: valor_final,
            },
        });

        return NextResponse.json({
            message: `Solicitação #${solicitacaoId} aprovada com sucesso! Aguardando pagamento.`,
            solicitacao: solicitacaoAprovada,
        }, { status: 200 });

    } catch (error: any) {
        console.error(`Erro ao aprovar solicitação ${params.id}:`, error);
        return NextResponse.json({ message: error.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}