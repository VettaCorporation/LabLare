// src/app/api/pacientes/route.ts (VERSÃO FINAL E AUTO-CORRIGÍVEL)

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { isValidCPF } from '../../../utils/cpfValidator';
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
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado.' }, { status: 403 });
    }

    const { nome_completo, cpf, data_nascimento, sexo, email } = await request.json();

    if (!nome_completo || !cpf || !data_nascimento || !email) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    if (!isValidCPF(cpf)) {
      return NextResponse.json({ message: 'O CPF fornecido é inválido.' }, { status: 400 });
    }

    const parsedDate = new Date(data_nascimento);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: 'O formato da data de nascimento é inválido.' }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, '');

    const pacienteExistente = await prisma.paciente.findUnique({ where: { cpf: cleanCpf } });
    if (pacienteExistente) {
      return NextResponse.json({ message: 'Este CPF já está cadastrado no sistema.' }, { status: 409 });
    }

    // ### SOLUÇÃO DEFINITIVA ADICIONADA AQUI ###
    // Verifica se o perfil 'Paciente' existe e, se não, cria-o.
    let patientProfile = await prisma.perfil.findUnique({
      where: { nome_perfil: 'Paciente' },
    });

    if (!patientProfile) {
      console.log("Perfil 'Paciente' não encontrado. A criá-lo agora...");
      patientProfile = await prisma.perfil.create({
        data: { nome_perfil: 'Paciente' },
      });
      console.log("Perfil 'Paciente' criado com sucesso.");
    }
    // ### FIM DA SOLUÇÃO ###

    const day = String(parsedDate.getUTCDate()).padStart(2, '0');
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
    const year = parsedDate.getUTCFullYear();
    const initialPassword = `${day}${month}${year}`;

    const hash_senha_inicial = await bcrypt.hash(initialPassword, 10);

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

      await tx.usuario.create({
        data: {
          nome_completo: newPatient.nome_completo,
          email: newPatient.email,
          cpf_login: newPatient.cpf,
          hash_senha: hash_senha_inicial,
          id_perfil: patientProfile.id_perfil, // Agora é garantido que existe
          primeiro_login: true,
        },
      });

      return { newPatient };
    });

    return NextResponse.json(newPatientAndUser.newPatient, { status: 201 });

  } catch (error: any) {
    console.error('--- ERRO FATAL CAPTURADO ---', error);
    return NextResponse.json({ message: 'Erro interno do servidor.', details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// A função GET permanece a mesma...
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }
    const allowedProfiles = ['Administrador', 'Recepcionista', 'Técnico de Laboratório', 'Biomédico', 'Responsável Financeira'];
    const userProfile = session.user?.nome_perfil;
    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('nome');
    let pacientes;
    if (searchTerm && searchTerm.length >= 3) {
      pacientes = await prisma.paciente.findMany({
        where: { OR: [{ nome_completo: { contains: searchTerm } }, { cpf: { contains: searchTerm } }] },
        orderBy: { nome_completo: 'asc' },
      });
    } else {
      pacientes = await prisma.paciente.findMany({ orderBy: { nome_completo: 'asc' } });
    }
    return NextResponse.json(pacientes, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Erro interno ao buscar pacientes.', details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}