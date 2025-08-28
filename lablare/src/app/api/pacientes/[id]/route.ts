// Caminho: src/app/api/pacientes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isValidCPF } from '@/utils/cpfValidator';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const { id } = params;
    const pacienteId = parseInt(id, 10);

    if (isNaN(pacienteId)) {
      return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id_paciente: pacienteId },
    });

    if (!paciente) {
      return NextResponse.json({ message: 'Paciente não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(paciente, { status: 200 });

  } catch (error: any) {
    console.error(`ERRO DETALHADO AO BUSCAR PACIENTE ${params.id}:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor.', details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Rota para ATUALIZAR um paciente (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
    }

    const body = await request.json();
    
    // --- MODIFICAÇÃO PONTUAL AQUI ---
    // Extrai o "contato" junto com os outros campos.
    const { data_nascimento, contato, ...updateData } = body;

    if ('cpf' in updateData) {
      delete updateData.cpf;
    }

    if (data_nascimento) {
      updateData.data_nascimento = new Date(data_nascimento);
    }

    // Adiciona o "contato" ao objeto que será salvo no banco.
    // Se "contato" for enviado no body, ele é incluído, senão é ignorado.
    if (contato !== undefined) {
        updateData.contato = contato;
    }
    // --- FIM DA MODIFICAÇÃO ---

    const updatedPaciente = await prisma.paciente.update({
      where: { id_paciente: id },
      data: updateData,
    });

    return NextResponse.json(updatedPaciente, { status: 200 });

  } catch (error: any) {
    console.error(`Erro ao atualizar paciente com ID: ${params.id}`, error);
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar paciente.', details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Rota para DELETAR um paciente (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador']; // Somente Admin pode deletar
    const userProfile = session.user?.nome_perfil;
    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
    }
    
    const solicitacoesCount = await prisma.solicitacao.count({ where: { id_paciente: id } });
    if (solicitacoesCount > 0) {
        return NextResponse.json({ message: 'Não é possível excluir pacientes com solicitações de exames vinculadas.' }, { status: 409 });
    }

    await prisma.paciente.delete({
      where: { id_paciente: id },
    });

    return NextResponse.json({ message: 'Paciente excluído com sucesso.' }, { status: 200 });

  } catch (error: any) {
     if (error.code === 'P2025') {
       return NextResponse.json({ message: 'Paciente não encontrado.' }, { status: 404 });
     }
    console.error(`Erro ao excluir paciente com ID: ${params.id}`, error);
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir paciente.', details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}