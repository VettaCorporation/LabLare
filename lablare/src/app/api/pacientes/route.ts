// src/app/api/pacientes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { isValidCPF } from '../../../utils/cpfValidator';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // 1. Verificação de Sessão e Permissão para Cadastrar Paciente
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

    // 1. Validação de campos obrigatórios (incluindo email)
    if (!nome_completo || !cpf || !data_nascimento || !email) { 
      return NextResponse.json({ message: 'Nome completo, CPF, Data de Nascimento e Email são obrigatórios.' }, { status: 400 });
    }

    // 2. Validação robusta do CPF
    if (!isValidCPF(cpf)) {
      return NextResponse.json({ message: 'O CPF fornecido é inválido.' }, { status: 400 });
    }

    // 3. Validação e formatação da data de nascimento
    const parsedDate = new Date(data_nascimento); 
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: 'O formato da data de nascimento é inválido.' }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, '');

    // 4. Verifica se o CPF já está cadastrado como Paciente
    const pacienteExistente = await prisma.paciente.findUnique({
      where: { cpf: cleanCpf },
    });

    if (pacienteExistente) {
      return NextResponse.json(
        { message: 'Este CPF já está cadastrado como paciente no sistema.', pacienteId: pacienteExistente.id_paciente },
        { status: 409 } 
      );
    }

    // 5. Verifica se o Email já está cadastrado como Paciente
    const emailPacienteExistente = await prisma.paciente.findUnique({
      where: { email: email },
    });

    if (emailPacienteExistente) {
      return NextResponse.json(
        { message: 'Este e-mail já está cadastrado para outro paciente.', pacienteId: emailPacienteExistente.id_paciente },
        { status: 409 } 
      );
    }

    // 6. Verificar se já existe um USUARIO com este CPF_LOGIN OU EMAIL (para evitar conflitos de unicidade)
    const userWithCpfLogin = await prisma.usuario.findUnique({
      where: { cpf_login: cleanCpf },
    });
    if (userWithCpfLogin) {
      return NextResponse.json({ error: 'Já existe um usuário de login (paciente) com este CPF.' }, { status: 409 });
    }

    const existingUserByEmail = await prisma.usuario.findUnique({
      where: { email: email }, 
    });
    if (existingUserByEmail) {
      return NextResponse.json({ error: 'Este e-mail já está em uso por outro usuário do sistema (interno ou paciente).' }, { status: 409 });
    }

    // 7. Preparar dados para o Usuário (login do paciente)
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

    // 8. Transação para criar Paciente e Usuário atomicamente
    const newPatientAndUser = await prisma.$transaction(async (tx) => {
      const newPatient = await tx.paciente.create({
        data: {
          nome_completo,
          cpf: cleanCpf,
          data_nascimento: parsedDate, 
          sexo: sexo || null, 
          email: email, 
        },
      });

      const newUser = await tx.usuario.create({
        data: {
          nome_completo: newPatient.nome_completo,
          email: newPatient.email, 
          cpf_login: newPatient.cpf, 
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
        if (error.meta?.target?.includes('email') && error.modelName === 'Paciente') { 
            return NextResponse.json({ error: 'Este e-mail já está cadastrado para outro paciente.' }, { status: 409 });
        }
        if (error.meta?.target?.includes('cpf') && error.modelName === 'Paciente') { 
            return NextResponse.json({ error: 'Este CPF já está cadastrado como paciente no sistema.' }, { status: 409 });
        }
        if (error.meta?.target?.includes('cpf_login') && error.modelName === 'Usuario') { 
            return NextResponse.json({ error: 'Já existe um usuário de login (paciente) com este CPF.' }, { status: 409 });
        }
        if (error.meta?.target?.includes('email') && error.modelName === 'Usuario') { 
          return NextResponse.json({ error: 'Este e-mail já está em uso por outro usuário do sistema (interno ou paciente).' }, { status: 409 });
        }
    }
    return NextResponse.json({ message: 'Erro interno do servidor ao tentar cadastrar o paciente.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

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
    const searchTerm = searchParams.get('nome');

    let pacientes;
    if (searchTerm && searchTerm.length >= 3) { 
       pacientes = await prisma.paciente.findMany({
        where: {
          OR: [
            { nome_completo: { contains: searchTerm } }, 
            { cpf: { contains: searchTerm } },
          ],
        },
        orderBy: { nome_completo: 'asc' },
      });
    } else {
      pacientes = await prisma.paciente.findMany({
        orderBy: { nome_completo: 'asc' },
      });
    }

    return NextResponse.json(pacientes, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar a lista de pacientes.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}