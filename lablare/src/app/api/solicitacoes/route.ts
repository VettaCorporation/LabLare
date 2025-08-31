// Caminho: src/app/api/solicitacoes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient, SolicitacaoStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// --- MÉTODO POST (NOVA LÓGICA OBRIGATÓRIA DE APROVAÇÃO) ---
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    const { id_paciente, examesSelecionados, medico_solicitante } = await req.json();
    const id_usuario_solicitante = Number(session.user.id);

    if (!id_paciente || !examesSelecionados || examesSelecionados.length === 0) {
      return NextResponse.json({ message: 'Dados obrigatórios são necessários.' }, { status: 400 });
    }

    // Lógica simplificada: toda solicitação agora aguarda aprovação
    const solicitacao = await prisma.solicitacao.create({
      data: {
        id_paciente,
        id_recepcionista: id_usuario_solicitante,
        medico_solicitante,
        status: SolicitacaoStatus.AGUARDANDO_APROVACAO, // Sempre pendente
        id_aprovador: null, // Sempre nulo na criação
      },
    });
    
    const itensSolicitacaoData = examesSelecionados.map((exame: { id_exame_catalogo: number }) => ({
        id_solicitacao: solicitacao.id_solicitacao,
        id_exame_catalogo: exame.id_exame_catalogo,
    }));
    await prisma.itemSolicitacao.createMany({ data: itensSolicitacaoData });

    return NextResponse.json({
        message: 'Solicitação criada com sucesso! Aguardando aprovação.',
        solicitacao: solicitacao,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao registrar solicitação:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}


// --- MÉTODO GET (ATUALIZADO COM FILTRO DE RECEPCIONISTA) ---
export async function GET(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const pacienteId = searchParams.get('pacienteId');
      const statusFilter = searchParams.get('status');
      const recepcionistaId = searchParams.get('recepcionistaId'); // Novo filtro

      let whereClause: any = {};

      if (pacienteId) whereClause.id_paciente = parseInt(pacienteId, 10);
      if (statusFilter) whereClause.status = statusFilter as SolicitacaoStatus;
      if (recepcionistaId) whereClause.id_recepcionista = parseInt(recepcionistaId, 10); // Lógica do novo filtro

      const solicitacoes = await prisma.solicitacao.findMany({
        where: whereClause,
        orderBy: { data_hora_solicitacao: 'desc' },
        include: {
          paciente: true,
          recepcionista: { select: { nome_completo: true } },
          aprovador: { select: { nome_completo: true } }, // Inclui o nome do aprovador
          itens_solicitacao: { include: { exame_catalogo: true } },
        },
      });
  
      return NextResponse.json(solicitacoes, { status: 200 });
  
    } catch (error: any) {
      console.error('Erro ao buscar solicitações:', error);
      return NextResponse.json({ error: 'Erro ao buscar solicitações.' }, { status: 500 });
    }
}