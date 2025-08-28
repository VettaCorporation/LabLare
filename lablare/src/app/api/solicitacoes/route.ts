// lablare/src/app/api/solicitacoes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { generateLabelHtml } from '../../../utils/printTemplates/generateLabelHtml';

const prisma = new PrismaClient();

// --- MÉTODO POST ---
/**
 * Manipula requisições POST para registrar uma nova solicitação de exames.
 * Permite que usuários com perfil 'Recepcionista' ou 'Administrador' criem solicitações.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON indicando sucesso, erro ou o HTML da etiqueta.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      id_paciente,
      id_usuario_solicitante,
      examesSelecionados,
      medico_solicitante,
      tipo_atendimento,
      forma_pagamento,
      valor_pago,
    } = await req.json();

    if (!id_paciente || !id_usuario_solicitante || !examesSelecionados || examesSelecionados.length === 0) {
      return NextResponse.json({ message: 'Dados obrigatórios (paciente, usuário solicitante, exames) são necessários.' }, { status: 400 });
    }

    const pacienteExiste = await prisma.paciente.findUnique({ where: { id_paciente: id_paciente } });
    if (!pacienteExiste) {
      return NextResponse.json({ message: 'Paciente não encontrado.' }, { status: 404 });
    }

    const usuarioSolicitante = await prisma.usuario.findUnique({
      where: { id_usuario: id_usuario_solicitante },
      include: { perfil: true },
    });

    if (!usuarioSolicitante || !usuarioSolicitante.ativo) {
      return NextResponse.json({ message: 'Usuário solicitante não encontrado ou inativo.' }, { status: 404 });
    }

    const isAuthorized = usuarioSolicitante.perfil?.nome_perfil === 'Recepcionista' ||
                         usuarioSolicitante.perfil?.nome_perfil === 'Administrador';

    if (!isAuthorized) {
      return NextResponse.json({ message: 'Permissão negada. Apenas Recepcionistas ou Administradores podem registrar solicitações.' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const solicitacao = await tx.solicitacao.create({
        data: {
          id_paciente: id_paciente,
          id_recepcionista: id_usuario_solicitante,
          medico_solicitante: medico_solicitante,
          status: 'AGUARDANDO_COLETA',
        },
      });

      const itensSolicitacaoData = examesSelecionados.map(exame => ({
        id_solicitacao: solicitacao.id_solicitacao,
        id_exame_catalogo: exame.id_exame_catalogo,
        status_item: 'Aguardando Coleta'
      }));

      await tx.itemSolicitacao.createMany({
        data: itensSolicitacaoData,
      });

      if (tipo_atendimento && forma_pagamento && valor_pago) {
        await tx.pagamento.create({
          data: {
            id_solicitacao: solicitacao.id_solicitacao,
            tipo_atendimento,
            forma_pagamento,
            valor_pago,
          }
        });
      }

      return { solicitacao };
    });

    const solicitacaoCompleta = await prisma.solicitacao.findUnique({
      where: { id_solicitacao: result.solicitacao.id_solicitacao },
      include: {
        paciente: true,
        itens_solicitacao: {
          include: {
            exame_catalogo: true,
          }
        }
      }
    });

    if (!solicitacaoCompleta) {
      return NextResponse.json({ message: 'Erro ao recuperar a solicitação completa.' }, { status: 500 });
    }

    const calculateAge = (birthdate: Date) => {
      const today = new Date();
      let age = today.getFullYear() - birthdate.getFullYear();
      const m = today.getMonth() - birthdate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
        age--;
      }
      return age;
    };
    
    const idadePaciente = calculateAge(solicitacaoCompleta.paciente.data_nascimento);
    const examesParaEtiqueta = solicitacaoCompleta.itens_solicitacao.map(item => ({
      nome_exame: item.exame_catalogo.nome_exame,
    }));
    
    const etiquetaHtml = generateLabelHtml(solicitacaoCompleta.paciente, idadePaciente, examesParaEtiqueta);

    return NextResponse.json({
      message: 'Solicitação de exames registrada e paga com sucesso! Etiqueta gerada.',
      solicitacao: result.solicitacao,
      etiquetaHtml: etiquetaHtml
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao registrar solicitação de exames:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao registrar solicitação.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// --- MÉTODO GET ---
/**
 * Manipula requisições GET para listar todas as solicitações de exames.
 * Pode filtrar por pacienteId se o parâmetro for fornecido.
 * Inclui dados do paciente, recepcionista e os exames solicitados.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON contendo a lista de solicitações ou um erro.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');
    const statusFilter = searchParams.get('status');

    let whereClause: any = {};

    if (pacienteId) {
      const parsedPacienteId = parseInt(pacienteId);
      if (isNaN(parsedPacienteId)) {
        return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
      }
      whereClause = { id_paciente: parsedPacienteId };
    }

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    // A consulta do Prisma foi corrigida para garantir que todas as relações sejam carregadas
    const solicitacoes = await prisma.solicitacao.findMany({
      where: whereClause,
      orderBy: {
        data_hora_solicitacao: 'desc',
      },
      include: {
        paciente: true,
        recepcionista: true,
        itens_solicitacao: {
          include: {
            exame_catalogo: true,
          },
        },
      },
    });

    // Filtra solicitações para garantir que todas as relações existam para evitar erros de renderização
    const filteredSolicitacoes = solicitacoes.filter(
      (solicitacao) =>
        solicitacao.paciente && solicitacao.recepcionista && solicitacao.itens_solicitacao.every(item => item.exame_catalogo)
    );

    return NextResponse.json(filteredSolicitacoes, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json({ error: 'Erro ao buscar solicitações de exames.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
