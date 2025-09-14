import { NextResponse, NextRequest } from 'next/server';
import { SolicitacaoStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route'; // Caminho corrigido
import prisma from '@/lib/prisma';

interface RecusarRouteParams {
    params: { id: string };
}

export async function POST(req: NextRequest, { params }: RecusarRouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user as any).nome_perfil !== 'Administrador') {
            return NextResponse.json({ message: 'Acesso negado. Apenas administradores podem recusar solicitações.' }, { status: 403 });
        }

        const solicitacaoId = parseInt(params.id, 10);
        if (isNaN(solicitacaoId)) {
            return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
        }
        
        const body = await req.json();
        const { motivo } = body;

        if (!motivo || motivo.trim() === '') {
             return NextResponse.json({ message: 'O motivo da recusa é obrigatório.' }, { status: 400 });
        }

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
                id_aprovador: Number((session.user as any).id),
                motivo_recusa: motivo,
            },
        });

        return NextResponse.json({ 
            message: `Solicitação #${solicitacaoId} recusada com sucesso.`,
            solicitacao: solicitacaoRecusada,
        }, { status: 200 });

    } catch (error: any) {
        console.error(`Erro ao recusar solicitação ${params.id}:`, error);
        return NextResponse.json({ message: error.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}
