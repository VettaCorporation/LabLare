import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Extrai os parâmetros da URL, como ?q=termo_buscado
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  // Validação para garantir que a busca não seja feita com um termo muito curto
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'O termo de busca deve ter pelo menos 2 caracteres.' },
      { status: 400 }
    );
  }

  try {
    const exames = await prisma.exameCatalogo.findMany({
      // A cláusula 'where' define as condições da busca
      where: {
        // Busca em 'nome_exame' por qualquer registro que contenha o termo da query.
        // A busca será case-insensitive se o seu banco de dados estiver configurado
        // com uma "collation" CI (Case-Insensitive), que é o padrão para muitos.
        nome_exame: {
          contains: query,
        },
      },
      // A cláusula 'select' especifica quais campos retornar
      select: {
        id_exame_catalogo: true,
        nome_exame: true,
        codigo_pardini: true, // Retorna o código para ser exibido
        origem: true,         // Retorna a origem (Pardini ou Lare)
      },
      // Limita o número de resultados para não sobrecarregar a aplicação
      take: 15,
    });

    // Retorna os exames encontrados em formato JSON
    return NextResponse.json(exames);
    
  } catch (error) {
    // Em caso de erro no servidor, loga o erro e retorna uma mensagem amigável
    console.error('Erro na API de busca de exames:', error);
    return NextResponse.json(
      { error: 'Não foi possível buscar os exames.' },
      { status: 500 }
    );
  }
}