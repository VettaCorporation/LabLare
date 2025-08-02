// lablare/src/app/api/solicitacoes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js'; // Caminho ajustado e com .js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Importa as opções de autenticação

const prisma = new PrismaClient();

// --- MÉTODO POST ---
/**
 * Manipula requisições POST para registrar uma nova solicitação de exames.
 * Permite que usuários com perfil 'Recepcionista' ou 'Administrador' criem solicitações.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON indicando sucesso ou erro.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      id_paciente,
      id_usuario_solicitante,
      examesSelecionados,
      medico_solicitante,
      observacoes_medicas,
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
        },
      });

      const itensSolicitacaoData = examesSelecionados.map(exame => ({
        id_solicitacao: solicitacao.id_solicitacao,
        id_exame_catalogo: exame.id_exame_catalogo,
      }));

      await tx.itemSolicitacao.createMany({
        data: itensSolicitacaoData,
      });

      return { solicitacao };
    });

    return NextResponse.json({ message: 'Solicitação de exames registrada com sucesso!', solicitacao: result.solicitacao }, { status: 201 });

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
    const pacienteId = searchParams.get('pacienteId'); // Parâmetro para filtrar por paciente

    let whereClause: any = {};

    if (pacienteId) {
      const parsedPacienteId = parseInt(pacienteId);
      if (isNaN(parsedPacienteId)) {
        return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
      }
      whereClause = { id_paciente: parsedPacienteId };
    }

    const solicitacoes = await prisma.solicitacao.findMany({
      where: whereClause, // Aplica o filtro se houver
      orderBy: {
        data_hora_solicitacao: 'desc', // Ordena das mais recentes para as mais antigas
      },
      include: { // Inclui dados relacionados de outras tabelas
        paciente: {
          select: {
            id_paciente: true,
            nome_completo: true,
            cpf: true,
            data_nascimento: true,
            email: true,
            sexo: true,
          },
        },
        recepcionista: { // ADICIONADO: Inclui dados do recepcionista
          select: {
            nome_completo: true,
            email: true,
          },
        },
        itens_solicitacao: {
          include: {
            exame_catalogo: {
              select: {
                id_exame_catalogo: true,
                nome_exame: true,
                preco: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(solicitacoes, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json({ error: 'Erro ao buscar solicitações de exames.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
