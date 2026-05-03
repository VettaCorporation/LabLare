// Caminho: /src/lib/prisma.ts
//
// Singleton de PrismaClient compartilhado por toda a aplicação.
// Em desenvolvimento, é armazenado em `global.prisma` para sobreviver ao
// hot-reload do Next.js (sem isso, cada hot-reload criaria nova conexão e
// esgotaria o pool do MySQL rapidamente).
//
// Não chame `prisma.$disconnect()` em rotas: o cliente é um singleton de
// processo de longa duração; desconectar fecha o pool globalmente e quebra
// requests subsequentes.

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
