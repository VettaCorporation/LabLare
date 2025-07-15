import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nome = searchParams.get('nome');

  if (!nome) {
    return NextResponse.json({ message: 'Parâmetro "nome" é obrigatório para a busca.' }, { status: 400 });
  }

  try {
    const pacientes = await prisma.paciente.findMany({
      where: {
        nome_completo: {
          contains: nome,
        },
      },
      select: { 
        id_paciente: true,
        nome_completo: true,
        cpf: true,
        data_nascimento: true,
      },
      take: 10, 
    });
    return NextResponse.json(pacientes);
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar pacientes.' }, { status: 500 });
  }
}