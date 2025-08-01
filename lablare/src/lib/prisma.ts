// Caminho: /src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// Declara uma variável global para armazenar a instância do Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Cria a instância do Prisma.
// Se já houver uma instância global, ela será reutilizada.
// Se não houver, uma nova instância será criada.
const prisma = global.prisma || new PrismaClient();

// Em ambiente de desenvolvimento, armazena a instância no objeto global.
// Isso evita que o hot-reloading do Next.js crie múltiplas instâncias do Prisma Client.
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Exporta a instância única para ser usada em qualquer parte do seu projeto.
export default prisma;