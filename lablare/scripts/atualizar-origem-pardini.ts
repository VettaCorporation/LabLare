// scripts/atualizar-origem-pardini.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Atualizando a origem dos exames Pardini...');
  const result = await prisma.exameCatalogo.updateMany({
    where: {
      codigo_pardini: {
        not: null,
      },
    },
    data: {
      origem: 'PARDINI' as any,
    },
  });
  console.log(`${result.count} exames foram atualizados para a origem PARDINI.`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());