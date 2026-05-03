import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { STATUS_ORCAMENTO } from '@/lib/statuses';
import { expirePendingOrcamentos } from '@/lib/jobs/orcamentoExpiry';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    // KPIs dependem do status correto — marca expirados antes de contar.
    await expirePendingOrcamentos();

    const orcamentosPendentes = await prisma.orcamento.count({ where: { status: STATUS_ORCAMENTO.PENDENTE } });
    const totalPendenteAgg = await prisma.orcamento.aggregate({
      _sum: { valor_final: true },
      where: { status: STATUS_ORCAMENTO.PENDENTE },
    });
    const valorTotalPendente = totalPendenteAgg._sum.valor_final || 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const aprovadosUltimoMes = await prisma.orcamento.count({
      where: { status: STATUS_ORCAMENTO.APROVADO, data_criacao: { gte: thirtyDaysAgo } },
    });
    const expiradosUltimoMes = await prisma.orcamento.count({
        where: { status: STATUS_ORCAMENTO.EXPIRADO, data_criacao: { gte: thirtyDaysAgo } }
    });
    const totalFinalizadosUltimoMes = aprovadosUltimoMes + expiradosUltimoMes;
    const taxaDeConversao = totalFinalizadosUltimoMes > 0 ? (aprovadosUltimoMes / totalFinalizadosUltimoMes) * 100 : 0;

    // --- Dados para o Gráfico de Pizza (sem alteração) ---
    const statusCounts = await prisma.orcamento.groupBy({
      by: ['status'],
      _count: { id_orcamento: true },
    });
    const pieChartData = statusCounts.map(item => ({
      name: item.status,
      value: item._count.id_orcamento,
    }));

    // --- NOVA LÓGICA: Dados para o Gráfico de Barras (Últimos 6 meses) ---
    const monthlyDataPromises = Array.from({ length: 6 }).map(async (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      const count = await prisma.orcamento.count({
        where: {
          data_criacao: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });
      
      const monthName = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toLocaleUpperCase();

      return {
        name: monthName,
        Orçamentos: count,
      };
    });

    const barChartData = (await Promise.all(monthlyDataPromises)).reverse();


    // Monta o objeto de resposta final com todos os dados
    const stats = {
      kpis: {
        pendentes: orcamentosPendentes,
        aprovadosMes: aprovadosUltimoMes,
        valorPendente: valorTotalPendente,
        taxaConversao: taxaDeConversao,
      },
      pieChart: pieChartData,
      barChart: barChartData, // Adiciona os novos dados do gráfico de barras
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas de orçamentos', error, { ctx: 'orcamentos' });
    return NextResponse.json({ message: 'Erro interno ao buscar estatísticas.' }, { status: 500 });
  }
}