// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Perfis
  const profiles = ['Administrador', 'Recepcionista', 'Biomédico', 'Técnico de Laboratório', 'Responsável Financeira', 'Paciente'];
  for (const name of profiles) {
    await prisma.perfil.upsert({
      where: { nome_perfil: name },
      update: {},
      create: { nome_perfil: name },
    });
  }
  console.log('Profiles seeded.');

  // 2. Configurações Iniciais
  await prisma.configuracao.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nomeLaboratorio: 'Lare Laboratório',
      endereco: 'Rua Exemplo, 123 - Sua Cidade, UF',
      telefone: '(XX) XXXX-XXXX',
      emailContato: 'contato@larelaboratorio.com.br',
      logoUrl: '/assets/img/Logo.png', // Caminho para o logo padrão
      rodapeLaudo: 'Este é um rodapé padrão para todos os laudos. Edite nas configurações.',
    },
  });
  console.log('Default settings seeded.');

  // 3. Usuários Padrão (Admin/Recep)
  const adminProfile = await prisma.perfil.findUnique({ where: { nome_perfil: 'Administrador' } });
  if (adminProfile) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.usuario.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        nome_completo: 'Admin Teste',
        email: 'admin@test.com',
        hash_senha: hashedPassword,
        id_perfil: adminProfile.id_perfil,
        primeiro_login: false,
      },
    });
  }

  const recepProfile = await prisma.perfil.findUnique({ where: { nome_perfil: 'Recepcionista' } });
  if (recepProfile) {
    const hashedPassword = await bcrypt.hash('recep123', 10);
    await prisma.usuario.upsert({
      where: { email: 'recep@test.com' },
      update: {},
      create: {
        nome_completo: 'Recepcionista Teste',
        email: 'recep@test.com',
        hash_senha: hashedPassword,
        id_perfil: recepProfile.id_perfil,
        primeiro_login: false,
      },
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });