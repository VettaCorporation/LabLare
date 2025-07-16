import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
// Importa a função de validação de CPF
import { isValidCPF } from '../../../utils/cpfValidator';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const data = await request.json();
    const { nome_completo, cpf, data_nascimento, sexo } = data;

    // 1. Validação de campos obrigatórios
    if (!nome_completo || !cpf || !data_nascimento) {
      return NextResponse.json({ message: 'Todos os campos obrigatórios (nome, CPF, data de nascimento) devem ser preenchidos.' }, { status: 400 });
    }

    // 2. Validação robusta do CPF usando a função importada
    if (!isValidCPF(cpf)) {
      return NextResponse.json({ message: 'O CPF fornecido é inválido.' }, { status: 400 });
    }

    // 3. Validação da data de nascimento
    const parsedDate = new Date(data_nascimento);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: 'O formato da data de nascimento é inválido.' }, { status: 400 });
    }

    // Limpa o CPF para salvar no banco de dados sem formatação
    const cleanCpf = cpf.replace(/\D/g, '');

    // Verifica se o CPF já está cadastrado
    const pacienteExistente = await prisma.paciente.findUnique({
      where: { cpf: cleanCpf },
    });

    if (pacienteExistente) {
      return NextResponse.json(
        { message: 'Este CPF já está cadastrado no sistema.', pacienteId: pacienteExistente.id_paciente },
        { status: 409 } // Status "Conflict"
      );
    }

    // Cria o novo paciente no banco de dados
    const novoPaciente = await prisma.paciente.create({
      data: {
        nome_completo,
        cpf: cleanCpf,
        data_nascimento: parsedDate,
        sexo,
      },
    });

    return NextResponse.json(novoPaciente, { status: 201 }); // Status "Created"

  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao tentar cadastrar o paciente.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    const pacientes = await prisma.paciente.findMany({
      orderBy: {
        nome_completo: 'asc',
      },
    });
    return NextResponse.json(pacientes, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error); // Corrigido para mensagem de erro específica do GET
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar a lista de pacientes.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}