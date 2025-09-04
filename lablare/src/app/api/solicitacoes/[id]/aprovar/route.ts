// Caminho: src/app/api/solicitacoes/[id]/aprovar/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { SolicitacaoStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma'; // Use a instância centralizada

// --- MÉTODO POST para aprovar uma solicitação ---
// Agora apenas muda o status, sem lidar com pagamento.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado. Apenas administradores podem aprovar solicitações.' }, { status: 403 });
    }

    const solicitacaoId = parseInt(params.id, 10);
    if (isNaN(solicitacaoId)) {
        return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }

    const id_usuario_aprovador = Number(session.user.id);

    const solicitacaoExistente = await prisma.solicitacao.findUnique({
        where: { id_solicitacao: solicitacaoId },
    });

    if (!solicitacaoExistente) {
        return NextResponse.json({ message: 'Solicitação não encontrada.' }, { status: 404 });
    }

    if (solicitacaoExistente.status !== SolicitacaoStatus.AGUARDANDO_APROVACAO) {
        return NextResponse.json({ message: 'Esta solicitação não pode mais ser aprovada.' }, { status: 409 }); // 409 Conflict
    }

    // A única ação agora é atualizar o status e o aprovador
    const solicitacaoAprovada = await prisma.solicitacao.update({
        where: { id_solicitacao: solicitacaoId },
        data: {
            status: SolicitacaoStatus.AGUARDANDO_PAGAMENTO, // Novo status!
            id_aprovador: id_usuario_aprovador,
        },
    });

    return NextResponse.json({ 
        message: 'Solicitação aprovada com sucesso! Aguardando pagamento.',
        solicitacao: solicitacaoAprovada,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`Erro ao aprovar solicitação ${params.id}:`, error);
    return NextResponse.json({ message: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}