// src/app/api/solicitacoes/[id]/aprovar/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { SolicitacaoStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { parseJson } from '@/lib/schemas/common';
import { aprovarSolicitacaoSchema } from '@/lib/schemas/solicitacoes';

interface AprovarRouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: AprovarRouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }

        const userProfile = session.user.nome_perfil;
        const userPrivileges = session.user?.privilegios || [];
        const hasApprovalPrivilege = userPrivileges.includes('/dashboard/aprovar-solicitacoes');

        if (userProfile !== 'Administrador' && !hasApprovalPrivilege) {
            return NextResponse.json({ message: 'Acesso negado. Você não tem permissão para aprovar solicitações.' }, { status: 403 });
        }

        const solicitacaoId = parseInt((await params).id, 10);
        if (isNaN(solicitacaoId)) {
            return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
        }

        // Aceita apenas desconto_percentual do client. valor_final NUNCA é confiável
        // do client — recalculado no backend usando preco_item gravado em ItemSolicitacao.
        const parsed = await parseJson(req, aprovarSolicitacaoSchema);
        if (!parsed.ok) return parsed.response;
        const { desconto_percentual: descontoPct } = parsed.data;

        const aprovadorId = Number(session.user.id);

        const solicitacaoExistente = await prisma.solicitacao.findUnique({
            where: { id_solicitacao: solicitacaoId },
            include: { itens_solicitacao: { select: { preco_item: true } } },
        });

        if (!solicitacaoExistente) {
            return NextResponse.json({ message: 'Solicitação não encontrada.' }, { status: 404 });
        }
        if (solicitacaoExistente.status !== SolicitacaoStatus.AGUARDANDO_APROVACAO) {
            return NextResponse.json({ message: 'Esta solicitação não pode mais ser aprovada.' }, { status: 409 });
        }
        if (solicitacaoExistente.itens_solicitacao.length === 0) {
            return NextResponse.json({ message: 'Solicitação sem itens — impossível aprovar.' }, { status: 400 });
        }

        const valorBruto = solicitacaoExistente.itens_solicitacao.reduce(
            (acc, item) => acc + Number(item.preco_item),
            0,
        );
        const valorFinalCalculado = Number((valorBruto * (1 - descontoPct / 100)).toFixed(2));

        const solicitacaoAprovada = await prisma.solicitacao.update({
            where: { id_solicitacao: solicitacaoId },
            data: {
                status: SolicitacaoStatus.AGUARDANDO_PAGAMENTO,
                id_aprovador: aprovadorId,
                desconto_percentual: descontoPct,
                valor_final: valorFinalCalculado,
            },
        });

        return NextResponse.json({
            message: `Solicitação #${solicitacaoId} aprovada com sucesso! Aguardando pagamento.`,
            solicitacao: solicitacaoAprovada,
        }, { status: 200 });

    } catch (error: any) {
        logger.error('Erro ao aprovar solicitação', error, { ctx: 'solicitacoes', solicitacaoId: (await params).id });
        return NextResponse.json({ message: 'Erro interno ao aprovar solicitação.' }, { status: 500 });
    }
}
