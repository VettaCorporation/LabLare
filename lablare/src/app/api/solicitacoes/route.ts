// lablare/src/app/api/solicitacoes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// ... (método POST permanece o mesmo) ...

// --- MÉTODO GET (Revisado para incluir dados do recepcionista) ---
/**
 * Manipula requisições GET para listar todas as solicitações de exames.
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
