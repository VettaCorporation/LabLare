import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET: Busca as configurações atuais do sistema (e as cria se não existirem)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    // Tenta buscar a configuração com ID 1
    let config = await prisma.configuracao.findUnique({
      where: { id: 1 },
    });

    // SE NÃO ENCONTRAR, CRIA A CONFIGURAÇÃO PADRÃO NA HORA!
    if (!config) {
      console.log('Nenhuma configuração encontrada, criando valores padrão...');
      config = await prisma.configuracao.create({
        data: {
          id: 1,
          nomeLaboratorio: 'Lare Laboratório (Nome Padrão)',
          endereco: 'Rua Exemplo, 123 - Sua Cidade, UF',
          telefone: '(XX) XXXX-XXXX',
          emailContato: 'contato@larelaboratorio.com.br',
          logoUrl: '/assets/img/Logo.png',
          rodapeLaudo: 'Este é um rodapé padrão. Edite nas configurações.',
        }
      });
    }

    // Agora, sempre teremos uma configuração para retornar
    return NextResponse.json(config, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar/criar configurações:', error);
    return NextResponse.json({ message: 'Erro interno ao processar configurações.' }, { status: 500 });
  }
}

// PUT: Atualiza as configurações do sistema
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado. Apenas administradores podem alterar as configurações.' }, { status: 403 });
    }

    const data = await request.json();

    const updatedConfig = await prisma.configuracao.update({
      where: { id: 1 },
      data: {
        nomeLaboratorio: data.nomeLaboratorio,
        endereco: data.endereco,
        telefone: data.telefone,
        emailContato: data.emailContato,
        rodapeLaudo: data.rodapeLaudo,
      },
    });

    return NextResponse.json({ message: 'Configurações salvas com sucesso!', config: updatedConfig }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ message: 'Erro interno ao salvar as configurações.' }, { status: 500 });
  }
}