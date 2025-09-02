// Caminho: src/app/api/pacientes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'; 
import { isValidCPF } from '../../../utils/cpfValidator';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// A função POST permanece a mesma, pois sua lógica está correta.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }
    const allowedProfiles = ['Administrador', 'Recepcionista'];
    const userProfile = session.user?.nome_perfil;
    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const { nome_completo, cpf, data_nascimento, sexo, email, contato } = await request.json();
    
    // --- Validações Iniciais ---
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

    // --- ▼▼▼ MELHORIA PRINCIPAL AQUI ▼▼▼ ---

    // 1. Verifica se o CPF já existe na tabela de Pacientes
    const pacienteExistente = await prisma.paciente.findUnique({
      where: { cpf: cleanCpf },
    });
    if (pacienteExistente) {
      // Mensagem específica para CPF de paciente duplicado
      return NextResponse.json({ message: 'Este CPF já está cadastrado como paciente.' }, { status: 409 });
    }

    // 2. Verifica se o CPF já existe como login na tabela de Usuários
    const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: cleanCpf }, // Lembre-se: o campo 'email' do usuário guarda o CPF
    });
    if (usuarioExistente) {
        // Mensagem específica para "login" (CPF) de usuário duplicado
        return NextResponse.json({ message: 'Já existe um usuário de login cadastrado com este CPF.' }, { status: 409 });
    }

    // --- FIM DA MELHORIA ---

    const day = String(parsedDate.getUTCDate()).padStart(2, '0');
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
    const year = parsedDate.getUTCFullYear();
    const initialPassword = `${day}${month}${year}`;
    const hash_senha_inicial = await bcrypt.hash(initialPassword, 10);
    
    const patientProfile = await prisma.perfil.findUnique({
      where: { nome_perfil: 'Paciente' },
    });
    if (!patientProfile) {
      return NextResponse.json({ message: 'Erro de configuração: Perfil "Paciente" não encontrado.' }, { status: 500 });
    }

    // A transação agora é mais segura, pois as verificações já foram feitas
    const newPatientAndUser = await prisma.$transaction(async (tx) => {
      const newPatient = await tx.paciente.create({
        data: {
          nome_completo,
          cpf: cleanCpf,
          data_nascimento: parsedDate,
          sexo: sexo || null,
          email: email || null,
          contato: contato || null,
        },
      });
      await tx.usuario.create({
        data: {
          nome_completo: newPatient.nome_completo,
          email: newPatient.cpf,
          hash_senha: hash_senha_inicial,
          id_perfil: patientProfile.id_perfil,
          primeiro_login: true,
        },
      });
      return { newPatient };
    });

    return NextResponse.json(newPatientAndUser.newPatient, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao cadastrar o paciente:', error);
    // Erro genérico para qualquer outra falha inesperada
    return NextResponse.json({ message: 'Erro interno do servidor ao tentar cadastrar o paciente.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// A função GET é a que foi corrigida.
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
        const nome = searchParams.get('nome');
        const cpf = searchParams.get('cpf');

        const whereClause: any = {};

        if (nome) {
            whereClause.nome_completo = {
                contains: nome,
                mode: 'insensitive', // Melhoria: Busca por nome sem diferenciar maiúsculas/minúsculas
            };
        }

        if (cpf) {
            whereClause.cpf = {
                startsWith: cpf.replace(/\D/g, ''),
            };
        }

        // --- ▼▼▼ AQUI ESTÁ A CORREÇÃO PRINCIPAL ▼▼▼ ---
        // A cláusula 'select' foi removida. Agora, a consulta retornará
        // todos os campos do modelo 'paciente', incluindo 'contato', 'sexo', etc.
        const pacientes = await prisma.paciente.findMany({
            where: whereClause,
            orderBy: {
                nome_completo: 'asc',
            },
            take: 50,
        });
        // --- ▲▲▲ FIM DA CORREÇÃO ▲▲▲ ---

        return NextResponse.json(pacientes, { status: 200 });
    } catch (error: any) {
        console.error('ERRO DETALHADO AO BUSCAR PACIENTES:', error);
        return NextResponse.json({ message: 'Erro interno do servidor ao buscar pacientes.', details: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}