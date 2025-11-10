import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma'; // Corrigido o caminho para o Prisma Client

const prisma = new PrismaClient();

export async function GET() {
  try {
    const colaboradores = await prisma.usuario.findMany({
      // *** CORREÇÃO: FILTRO PARA EXCLUIR PACIENTES ***
      where: {
        perfil: {
          nome_perfil: {
            not: 'Paciente', // Filtra onde o nome_perfil NÃO é 'Paciente'
          },
        },
      },
      // **********************************************
      select: {
        id_usuario: true,
        nome_completo: true,
        email: true,
        ativo: true,
        perfil: { // Inclui o nome do perfil
          select: {
            nome_perfil: true,
          },
        },
      },
      orderBy: {
        nome_completo: 'asc',
      },
    });

    return NextResponse.json(colaboradores);
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar colaboradores.' }, { status: 500 });
  }
}