import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { logger } from '@/lib/logger';
import { expirePendingOrcamentos } from '@/lib/jobs/orcamentoExpiry';

// GET: Lista todos os orçamentos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userProfile = session?.user?.nome_perfil;

    if (!userProfile || !['Administrador', 'Recepcionista'].includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    // Marca orçamentos pendentes vencidos como Expirado antes de listar.
    await expirePendingOrcamentos();

    const orcamentos = await prisma.orcamento.findMany({
      orderBy: { data_criacao: 'desc' },
      include: {
        paciente: {
          select: { nome_completo: true, cpf: true },
        },
        recepcionista: {
          select: { nome_completo: true },
        },
        itens: {
          include: {
            exame_catalogo: { select: { nome_exame: true } },
          },
        },
      },
    });

    return NextResponse.json(orcamentos, { status: 200 });

  } catch (error) {
    logger.error('Erro ao buscar orçamentos', error, { ctx: 'orcamentos' });
    return NextResponse.json({ message: 'Erro interno ao buscar orçamentos.' }, { status: 500 });
  }
}


// POST: Cria um novo orçamento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userProfile = session?.user?.nome_perfil;
    const recepcionistaId = Number(session?.user?.id);

    if (!userProfile || !['Administrador', 'Recepcionista'].includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const {
      id_paciente,
      exames, // Array de { id_exame_catalogo, preco }
      desconto,
      validadeDias,
    } = await request.json();

    if (!id_paciente || !exames || exames.length === 0 || !validadeDias) {
      return NextResponse.json({ message: 'Dados insuficientes para criar o orçamento.' }, { status: 400 });
    }

    // Cálculos do valor
    const valor_bruto = exames.reduce((acc: number, exame: any) => acc + parseFloat(exame.preco), 0);
    const valor_final = valor_bruto - parseFloat(desconto);
    
    const data_validade = new Date();
    data_validade.setDate(data_validade.getDate() + Number(validadeDias));

    const novoOrcamento = await prisma.orcamento.create({
      data: {
        id_paciente: Number(id_paciente),
        id_recepcionista: recepcionistaId,
        data_validade: data_validade,
        valor_bruto: new Decimal(valor_bruto),
        desconto: new Decimal(desconto),
        valor_final: new Decimal(valor_final),
        itens: {
          create: exames.map((exame: any) => ({
            id_exame_catalogo: Number(exame.id_exame_catalogo),
            preco_exame: new Decimal(exame.preco),
          })),
        },
      },
      include: {
        itens: true, // Inclui os itens criados na resposta
      },
    });

    return NextResponse.json({ message: 'Orçamento criado com sucesso!', orcamento: novoOrcamento }, { status: 201 });

  } catch (error) {
    logger.error('Erro ao criar orçamento', error, { ctx: 'orcamentos' });
    return NextResponse.json({ message: 'Erro interno ao criar o orçamento.' }, { status: 500 });
  }
}