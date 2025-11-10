// Caminho: /src/lib/prisma.ts

// *** CORREÇÃO AQUI: Importação CommonJS/Compatível ***
// Usa 'require' e depois a desestruturação para garantir que o módulo seja carregado corretamente.
// Embora este arquivo use 'import', o NodeJS pode estar tratando '@prisma/client' como um módulo especial.
// Vamos usar a sintaxe que funciona na maioria dos ambientes híbridos:
const { PrismaClient } = require('@prisma/client'); 
// ----------------------------------------

// Declara uma variável global para armazenar a instância do Prisma
declare global {
  // O tipo correto é importado diretamente aqui, sem conflitos com a sintaxe de exportação
  // eslint-disable-next-line no-var
  var prisma: typeof PrismaClient | undefined; 
}

// Cria a instância do Prisma.
// Se já houver uma instância global, ela será reutilizada.
// Se não houver, uma nova instância será criada.
const prisma = global.prisma || new PrismaClient(); // A instanciação agora deve funcionar

// Em ambiente de desenvolvimento, armazena a instância no objeto global.
// Isso evita que o hot-reloading do Next.js crie múltiplas instâncias do Prisma Client.
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Exporta a instância única para ser usada em qualquer parte do seu projeto.
export default prisma;