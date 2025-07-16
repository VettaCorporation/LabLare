import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js'; 

const prisma = new PrismaClient();

export async function POST(req) {
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

  } catch (error) {
    console.error('Erro ao registrar solicitação de exames:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao registrar solicitação.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req) {
  // Extrai os parâmetros de busca da URL da requisição
  const { searchParams } = new URL(req.url);
  const pacienteId = searchParams.get('pacienteId');

  try {
    // Objeto de condição para a query do Prisma
    const whereCondition = {};
    if (pacienteId) {
      // Se um pacienteId for fornecido, adiciona à condição de busca
      whereCondition.id_paciente = parseInt(pacienteId, 10);
    }

    const solicitacoes = await prisma.solicitacao.findMany({
      where: whereCondition, // Aplica a condição de busca
      orderBy: {
        data_hora_solicitacao: 'desc',
      },
      include: {
        paciente: {
          select: {
            nome_completo: true,
            cpf: true,
          },
        },
        recepcionista: {
          select: {
            nome_completo: true,
            email: true,
          },
        },
        itens_solicitacao: {
          include: {
            exame_catalogo: {
              select: {
                nome_exame: true,
                preco: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(solicitacoes, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    // Adiciona uma verificação para retornar um erro mais específico caso o ID seja inválido
    if (error instanceof Error && error.message.includes('Argument `id_paciente`')) {
      return NextResponse.json({ error: 'ID de paciente inválido.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao buscar solicitações de exames.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
