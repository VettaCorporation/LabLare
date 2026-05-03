// Caminho: src/app/api/pacientes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET: Busca um paciente e suas solicitações
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }
        
        // Acesso total para o Administrador, outros perfis precisam da permissão
        const userProfile = session.user?.nome_perfil;
        if (userProfile !== 'Administrador') {
            const userPrivileges = session.user?.privilegios || [];
            if (!userPrivileges.includes('/dashboard/pacientes')) {
                return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
            }
        }

        const pacienteId = parseInt((await params).id, 10);
        if (isNaN(pacienteId)) {
            return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
        }

        const paciente = await prisma.paciente.findUnique({
            where: { id_paciente: pacienteId },
            include: {
                solicitacoes: {
                    include: {
                        itens_solicitacao: {
                            include: {
                                exame_catalogo: true,
                            },
                        },
                    },
                },
            },
        });

        if (!paciente) {
            return NextResponse.json({ message: 'Paciente não encontrado.' }, { status: 404 });
        }

        return NextResponse.json(paciente, { status: 200 });
    } catch (error: any) {
        logger.error('Erro ao buscar paciente', error, { ctx: 'pacientes', pacienteId: (await params).id });
        return NextResponse.json({ message: 'Erro interno do servidor.', details: error.message }, { status: 500 });
    }
}

// PUT: Atualiza um paciente
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }

        const userProfile = session.user?.nome_perfil;
        const userPrivileges = session.user?.privilegios || [];
        
        // VERIFICAÇÃO DE PRIVILÉGIO PARA EDIÇÃO
        if (userProfile !== 'Administrador' && !userPrivileges.includes('/dashboard/pacientes/editar')) {
            return NextResponse.json({ message: 'Acesso negado para editar paciente.' }, { status: 403 });
        }

        const pacienteId = parseInt((await params).id, 10);
        if (isNaN(pacienteId)) {
            return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
        }

        const body = await request.json();
        const { data_nascimento, ...updateData } = body;

        // Note: O campo `cpf` não deve ser alterado aqui para evitar erros.
        if ('cpf' in updateData) {
            delete updateData.cpf;
        }

        if (data_nascimento) {
            updateData.data_nascimento = new Date(data_nascimento);
        }

        const updatedPaciente = await prisma.paciente.update({
            where: { id_paciente: pacienteId },
            data: updateData,
        });

        return NextResponse.json(updatedPaciente, { status: 200 });

    } catch (error: any) {
        logger.error('Erro ao atualizar paciente', error, { ctx: 'pacientes', pacienteId: (await params).id });
        return NextResponse.json({ message: 'Erro interno do servidor ao atualizar paciente.', details: error.message }, { status: 500 });
    }
}

// DELETE: Exclui um paciente
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }

        const userProfile = session.user?.nome_perfil;
        const userPrivileges = session.user?.privilegios || [];
        
        // VERIFICAÇÃO DE PRIVILÉGIO PARA EXCLUSÃO
        if (userProfile !== 'Administrador' && !userPrivileges.includes('/dashboard/pacientes/excluir')) {
            return NextResponse.json({ message: 'Acesso negado para excluir paciente.' }, { status: 403 });
        }

        const pacienteId = parseInt((await params).id, 10);
        if (isNaN(pacienteId)) {
            return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
        }
        
        const existingPatient = await prisma.paciente.findUnique({
            where: { id_paciente: pacienteId },
        });

        if (!existingPatient) {
            return NextResponse.json({ message: 'Paciente não encontrado.' }, { status: 404 });
        }

        // Soft-delete: preserva solicitações/orçamentos históricos vinculados.
        await prisma.paciente.update({
            where: { id_paciente: pacienteId },
            data: { ativo: false },
        });

        return NextResponse.json({ message: 'Paciente excluído com sucesso.' }, { status: 200 });

    } catch (error: any) {
        logger.error('Erro ao excluir paciente', error, { ctx: 'pacientes', pacienteId: (await params).id });
        return NextResponse.json({ message: 'Erro interno do servidor ao excluir paciente.', details: error.message }, { status: 500 });
    }
}