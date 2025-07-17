// lablare/src/app/api/pacientes/route.ts

import { NextRequest, NextResponse } from 'next/server';
// Caminho do Prisma Client: Mantém a extensão '.js' para o arquivo gerado.
import { PrismaClient } from '../../../generated/prisma/index.js';
// CORREÇÃO AQUI: Removida a extensão '.js' da importação do cpfValidator,
// pois o arquivo real é 'cpfValidator.ts'.
import { isValidCPF } from '../../../utils/cpfValidator'; // AGORA SEM '.js'
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Importa as opções de autenticação

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

    // 2. Validação de campos obrigatórios
    if (!nome_completo || !cpf || !data_nascimento) {
      return NextResponse.json({ message: 'Nome completo, CPF e Data de Nascimento são obrigatórios.' }, { status: 400 });
    }

    // 3. Validação robusta do CPF
    // Certifique-se que 'isValidCPF' está importado e funcionando corretamente
    if (!isValidCPF(cpf)) {
      return NextResponse.json({ message: 'O CPF fornecido é inválido.' }, { status: 400 });
    }

    // 4. Validação e formatação da data de nascimento
    const parsedDate = new Date(data_nascimento); 
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: 'O formato da data de nascimento é inválido.' }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, '');

    // 5. Verifica se o CPF já está cadastrado como Paciente
    const pacienteExistente = await prisma.paciente.findUnique({
      where: { cpf: cleanCpf },
    });

    if (pacienteExistente) {
      return NextResponse.json(
        { message: 'Este CPF já está cadastrado como paciente no sistema.', pacienteId: pacienteExistente.id_paciente },
        { status: 409 } 
      );
    }

    // 6. Preparar dados para o Usuário (login do paciente)
    // A senha inicial do paciente será o dia, mês e ano de nascimento
    const day = String(parsedDate.getUTCDate()).padStart(2, '0');
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0'); 
    const year = parsedDate.getUTCFullYear();
    const initialPassword = `${day}${month}${year}`; 

    const hash_senha_inicial = await bcrypt.hash(initialPassword, 10); 

    // Busca o perfil 'Paciente' para associar o novo usuário
    const patientProfile = await prisma.perfil.findUnique({
      where: { nome_perfil: 'Paciente' }, 
    });

    if (!patientProfile) {
      return NextResponse.json({ error: 'Erro de configuração: Perfil "Paciente" não encontrado no banco de dados. Por favor, execute o script de seed.' }, { status: 500 });
    }

    // 7. Transação para criar Paciente e Usuário atomicamente
    const newPatientAndUser = await prisma.$transaction(async (tx) => {
      const newPatient = await tx.paciente.create({
        data: {
          nome_completo,
          cpf: cleanCpf,
          data_nascimento: parsedDate, 
          sexo: sexo || null, 
          email: email || null, // Salva o email do paciente, se fornecido
        },
      });

      // Cria um usuário associado ao paciente para login no portal do paciente
      const newUser = await tx.usuario.create({
        data: {
          nome_completo: newPatient.nome_completo,
          email: newPatient.cpf, // O login do paciente será o CPF
          hash_senha: hash_senha_inicial, 
          id_perfil: patientProfile.id_perfil, 
          primeiro_login: true, // Marca como primeiro login para forçar troca de senha, se necessário
        },
      });

      return { newPatient, newUser };
    });

    // Retorna apenas os dados do paciente criado
    return NextResponse.json(newPatientAndUser.newPatient, { status: 201 });

  } catch (error: any) {
    // Tratamento de erros específicos (ex: CPF/email duplicado na tabela Usuario)
    if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
            return NextResponse.json({ error: 'Já existe um usuário de login com este CPF. Paciente já pode ter um cadastro de acesso.' }, { status: 400 });
        }
        // Se o erro P2002 for em outro campo unique (ex: CPF no Paciente), ele já foi tratado antes
    }
    console.error('Erro ao tentar cadastrar o paciente:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao tentar cadastrar o paciente.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Rota GET para listar pacientes (com verificação de sessão e permissão)
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
    const searchTerm = searchParams.get('nome'); // Termo de busca (nome ou CPF)

    let pacientes;
    if (searchTerm && searchTerm.length >= 3) { 
       pacientes = await prisma.paciente.findMany({
        where: {
          OR: [
            // Removido 'mode: insensitive' - MySQL geralmente é case-insensitive por padrão para 'contains'
            { nome_completo: { contains: searchTerm } },
            { cpf: { contains: searchTerm } }, // Permite buscar por CPF também
          ],
        },
        orderBy: { nome_completo: 'asc' },
      });
    } else {
      // Se não há termo de busca, retorna todos os pacientes
      pacientes = await prisma.paciente.findMany({
        orderBy: { nome_completo: 'asc' },
      });
    }

    return NextResponse.json(pacientes, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar a lista de pacientes:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar a lista de pacientes.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
