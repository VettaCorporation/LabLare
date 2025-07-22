// src/app/api/pacientes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Função para DELETAR um paciente
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    // Apenas Administradores podem deletar
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const patientId = parseInt(params.id, 10);
    if (isNaN(patientId)) {
      return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
    }

    // Tenta deletar o paciente
    await prisma.paciente.delete({
      where: { id_paciente: patientId },
    });

    return NextResponse.json({ message: 'Paciente deletado com sucesso.' }, { status: 200 });

  } catch (error: any) {
    // Trata erro comum do Prisma para chaves estrangeiras (paciente com solicitações)
    if (error.code === 'P2003') {
      return NextResponse.json({ message: 'Não é possível deletar este paciente pois ele possui solicitações de exames vinculadas.' }, { status: 409 });
    }
    console.error('Erro ao deletar paciente:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Função para ATUALIZAR (Editar) um paciente
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        const allowedProfiles = ['Administrador', 'Recepcionista'];
        if (!session?.user?.nome_perfil || !allowedProfiles.includes(session.user.nome_perfil)) {
            return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
        }

        const patientId = parseInt(params.id, 10);
        if (isNaN(patientId)) {
            return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
        }
        
        const data = await request.json();
        const { nome_completo, data_nascimento, sexo, email } = data;

        // Validação simples dos dados recebidos
        if (!nome_completo || !data_nascimento || !sexo || !email) {
            return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
        }

        const updatedPatient = await prisma.paciente.update({
            where: { id_paciente: patientId },
            data: {
                nome_completo,
                data_nascimento: new Date(data_nascimento),
                sexo,
                email,
            },
        });

        return NextResponse.json(updatedPatient, { status: 200 });

    } catch (error: any) {
        if (error.code === 'P2002') { // Erro de campo único (email)
            return NextResponse.json({ message: 'O e-mail fornecido já está em uso por outro paciente.' }, { status: 409 });
        }
        console.error('Erro ao atualizar paciente:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}