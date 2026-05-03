import { NextResponse, NextRequest } from 'next/server';
import { SolicitacaoStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { parseJson } from '@/lib/schemas/common';
import { recusarSolicitacaoSchema } from '@/lib/schemas/solicitacoes';

interface RecusarRouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RecusarRouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || session.user.nome_perfil !== 'Administrador') {
            return NextResponse.json({ message: 'Acesso negado. Apenas administradores podem recusar solicitações.' }, { status: 403 });
        }

        const solicitacaoId = parseInt((await params).id, 10);
        if (isNaN(solicitacaoId)) {
            return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
        }
        
        const parsed = await parseJson(req, recusarSolicitacaoSchema);
        if (!parsed.ok) return parsed.response;
        const { motivo } = parsed.data;

        const solicitacaoExistente = await prisma.solicitacao.findUnique({
            where: { id_solicitacao: solicitacaoId },
        });

        if (!solicitacaoExistente) {
            return NextResponse.json({ message: 'Solicitação não encontrada.' }, { status: 404 });
        }
        if (solicitacaoExistente.status !== SolicitacaoStatus.AGUARDANDO_APROVACAO) {
            return NextResponse.json({ message: 'Esta solicitação não pode mais ser recusada.' }, { status: 409 });
        }

        const solicitacaoRecusada = await prisma.solicitacao.update({
            where: { id_solicitacao: solicitacaoId },
            data: {
                status: SolicitacaoStatus.CANCELADO,
                id_aprovador: Number(session.user.id),
                motivo_recusa: motivo,
            },
        });

        return NextResponse.json({ 
            message: `Solicitação #${solicitacaoId} recusada com sucesso.`,
            solicitacao: solicitacaoRecusada,
        }, { status: 200 });

    } catch (error: any) {
        logger.error('Erro ao recusar solicitação', error, { ctx: 'solicitacoes', solicitacaoId: (await params).id });
        return NextResponse.json({ message: error.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}
