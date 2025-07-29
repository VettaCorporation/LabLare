// lablare/src/app/api/pacientes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js';
import { isValidCPF } from '../../../utils/cpfValidator'; // Assumindo que cpfValidator.ts existe em src/utils/
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Recepcionista']; 
    const userProfile = session.user?.nome_perfil;

    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para cadastrar pacientes.' }, { status: 403 });
    }

    const { nome_completo, cpf, data_nascimento, sexo, email } = await request.json(); 

    if (!nome_completo || !cpf || !data_nascimento) {
      return NextResponse.json({ message: 'Nome completo, CPF e Data de Nascimento são obrigatórios.' }, { status: 400 });
    }

    if (!isValidCPF(cpf)) {
      return NextResponse.json({ message: 'O CPF fornecido é inválido.' }, { status: 400 });
    }

    const parsedDate = new Date(data_nascimento); 
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: 'O formato da data de nascimento é inválido.' }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, '');

    const pacienteExistente = await prisma.paciente.findUnique({
      where: { cpf: cleanCpf },
    });

    if (pacienteExistente) {
      return NextResponse.json(
        { message: 'Este CPF já está cadastrado como paciente no sistema.', pacienteId: pacienteExistente.id_paciente },
        { status: 409 } 
      );
    }

    const day = String(parsedDate.getUTCDate()).padStart(2, '0');
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0'); 
    const year = parsedDate.getUTCFullYear();
    const initialPassword = `${day}${month}${year}`; 

    const hash_senha_inicial = await bcrypt.hash(initialPassword, 10); 

    const patientProfile = await prisma.perfil.findUnique({
      where: { nome_perfil: 'Paciente' }, 
    });

    if (!patientProfile) {
      return NextResponse.json({ error: 'Erro de configuração: Perfil "Paciente" não encontrado no banco de dados. Por favor, execute o script de seed.' }, { status: 500 });
    }

    const newPatientAndUser = await prisma.$transaction(async (tx) => {
      const newPatient = await tx.paciente.create({
        data: {
          nome_completo,
          cpf: cleanCpf,
          data_nascimento: parsedDate, 
          sexo: sexo || null, 
          email: email || null,
        },
      });

      const newUser = await tx.usuario.create({
        data: {
          nome_completo: newPatient.nome_completo,
          email: newPatient.cpf,
          hash_senha: hash_senha_inicial, 
          id_perfil: patientProfile.id_perfil, 
          primeiro_login: true,
        },
      });

      return { newPatient, newUser };
    });

    return NextResponse.json(newPatientAndUser.newPatient, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
            return NextResponse.json({ error: 'Já existe um usuário de login com este CPF. Paciente já pode ter um cadastro de acesso.' }, { status: 400 });
        }
    }
    console.error('Erro ao tentar cadastrar o paciente:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao tentar cadastrar o paciente.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// --- MÉTODO GET: Lida com a listagem e busca de pacientes ---
/**
 * Manipula requisições GET para listar pacientes.
 * Pode listar todos os pacientes ou filtrar por nome/CPF se parâmetros forem fornecidos.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON contendo a lista de pacientes ou um erro.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }
    const allowedProfiles = ['Administrador', 'Recepcionista', 'Técnico de Laboratório', 'Biomédico', 'Responsável Financeira'];
    const userProfile = session.user?.nome_perfil;
    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para visualizar pacientes.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('nome') || searchParams.get('cpf'); // Pega 'nome' ou 'cpf'

    let whereClause: any = {};

    if (searchTerm && searchTerm.length >= 3) { // Aplica filtro apenas se o termo tiver 3+ caracteres
      // Se o searchTerm for um CPF válido, busca por CPF
      const cleanCpf = searchTerm.replace(/\D/g, '');
      if (cleanCpf.length === 11 && isValidCPF(cleanCpf)) { // Usa isValidCPF para o CPF
        whereClause = { cpf: cleanCpf };
      } else { // Caso contrário, busca por nome completo (case-insensitive)
        whereClause = {
          nome_completo: {
            contains: searchTerm,
            // mode: 'insensitive', // Removido, pois não é suportado por MySQL
          },
        };
      }
    }
    // Se nenhum searchTerm for fornecido ou for muito curto, whereClause permanece vazio,
    // resultando na busca de todos os pacientes.

    const pacientes = await prisma.paciente.findMany({
      where: whereClause,
      select: {
        id_paciente: true,
        nome_completo: true,
        cpf: true,
        data_nascimento: true,
        sexo: true,
        email: true,
      },
      orderBy: {
        nome_completo: 'asc',
      },
      // Não usa 'take' aqui para listagem geral, apenas se for uma busca específica com limite.
      // Se quiser limitar a listagem geral, adicione 'take: X' aqui.
    });

    return NextResponse.json(pacientes, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar pacientes:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar pacientes.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
