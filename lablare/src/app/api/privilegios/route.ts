// src/app/api/privilegios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET: Retorna a lista de perfis com seus privilégios e a lista completa de privilégios
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.nome_perfil !== 'Administrador') {
        return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const [perfis, todosPrivilegios] = await Promise.all([
            prisma.perfil.findMany({
                where: {
                    // Busca todos os perfis, exceto 'Paciente' e 'Administrador'
                    nome_perfil: {
                        not: {
                            in: ['Paciente', 'Administrador']
                        }
                    }
                },
                include: {
                    privilegios: {
                        select: {
                            rota: true,
                            nome: true,
                            descricao: true,
                        }
                    }
                },
                orderBy: { nome_perfil: 'asc' }
            }),
            prisma.privilegio.findMany({
                select: {
                    rota: true,
                    nome: true,
                    descricao: true,
                },
                orderBy: { rota: 'asc' }
            })
        ]);

        const perfisFormatados = perfis.map(perfil => ({
            id_perfil: perfil.id_perfil,
            nome_perfil: perfil.nome_perfil,
            privilegios: perfil.privilegios.map(p => p.rota)
        }));

        return NextResponse.json({
            perfis: perfisFormatados,
            todosPrivilegios: todosPrivilegios,
        });

    } catch (error) {
        console.error("Erro ao buscar perfis e privilégios:", error);
        return NextResponse.json({ message: 'Erro interno ao buscar privilégios.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// PUT: Atualiza os privilégios de um perfil
export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.nome_perfil !== 'Administrador') {
        return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    const { id_perfil, privilegios } = await request.json();

    if (!id_perfil || !privilegios) {
        return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
    }

    try {
        const perfil = await prisma.perfil.findUnique({
            where: { id_perfil: parseInt(id_perfil) }
        });

        // Garante que o perfil 'Administrador' não pode ser alterado por essa rota
        if (!perfil || perfil.nome_perfil === 'Administrador') {
            return NextResponse.json({ message: 'Não é possível alterar este perfil.' }, { status: 403 });
        }

        const privilegiosDoBanco = await prisma.privilegio.findMany({
            where: { rota: { in: privilegios } }
        });

        await prisma.perfil.update({
            where: { id_perfil: parseInt(id_perfil) },
            data: {
                privilegios: {
                    set: privilegiosDoBanco.map(p => ({ id_privilegio: p.id_privilegio }))
                }
            }
        });

        return NextResponse.json({ message: 'Privilégios atualizados com sucesso.' });

    } catch (error) {
        console.error("Erro ao atualizar privilégios:", error);
        return NextResponse.json({ message: 'Erro ao salvar os privilégios.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}