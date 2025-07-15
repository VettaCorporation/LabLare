import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma'; 

const prisma = new PrismaClient();

export async function POST(request) {
  const data = await request.json();
  const { nome_completo, cpf, data_nascimento, sexo } = data; 

  if (!nome_completo || !cpf || !data_nascimento) {
    return NextResponse.json({ message: 'Dados obrigatórios (nome_completo, cpf, data_nascimento) são necessários.' }, { status: 400 });
  }

  const cleanCpf = cpf.replace(/\D/g, ''); 
  if (cleanCpf.length !== 11) {
      return NextResponse.json({ message: 'CPF inválido (deve conter 11 dígitos numéricos).' }, { status: 400 });
  }

  const parsedDate = new Date(data_nascimento);
  if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: 'Data de nascimento inválida.' }, { status: 400 });
  }

  try {
    const pacienteExistente = await prisma.paciente.findUnique({
      where: { cpf: cleanCpf }, 
    });

    if (pacienteExistente) {
      return NextResponse.json(
        { message: 'CPF já cadastrado.', pacienteId: pacienteExistente.id_paciente },
        { status: 409 }
      );
    }

    const novoPaciente = await prisma.paciente.create({
      data: {
        nome_completo,
        cpf: cleanCpf, 
        data_nascimento: parsedDate, 
        sexo, 
      },
    });

    return NextResponse.json(novoPaciente, { status: 201 }); 
  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao cadastrar paciente.' }, { status: 500 });
  } finally {
    await prisma.$disconnect(); 
  }
}