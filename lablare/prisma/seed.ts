// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Senha padrão usada quando SEED_*_PASSWORD não está em env.
 * É forte o suficiente para passar pela política de senha do app, mas
 * é deliberadamente "temporária" — combinada com `primeiro_login: true`,
 * o usuário é forçado a trocar no primeiro login.
 */
const FALLBACK_TEMP_PASSWORD = 'TrocarSenha@2026';

interface SeedUserConfig {
  email: string;
  nome: string;
  perfilNome: string;
  envVar: string;
  fallback: string;
}

const seedUsers: SeedUserConfig[] = [
  {
    email: 'admin@test.com',
    nome: 'Admin Teste',
    perfilNome: 'Administrador',
    envVar: 'SEED_ADMIN_PASSWORD',
    fallback: FALLBACK_TEMP_PASSWORD,
  },
  {
    email: 'recep@test.com',
    nome: 'Recepcionista Teste',
    perfilNome: 'Recepcionista',
    envVar: 'SEED_RECEP_PASSWORD',
    fallback: FALLBACK_TEMP_PASSWORD,
  },
];

async function main() {
  console.log('Start seeding...');

  // 1. Perfis
  const profiles = [
    'Administrador',
    'Recepcionista',
    'Biomédico',
    'Técnico de Laboratório',
    'Responsável Financeira',
    'Paciente',
  ];
  for (const name of profiles) {
    await prisma.perfil.upsert({
      where: { nome_perfil: name },
      update: {},
      create: { nome_perfil: name },
    });
  }
  console.log('Profiles seeded.');

  // 2. Configurações iniciais
  await prisma.configuracao.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nomeLaboratorio: 'Lare Laboratório',
      endereco: 'Rua Exemplo, 123 - Sua Cidade, UF',
      telefone: '(XX) XXXX-XXXX',
      emailContato: 'contato@larelaboratorio.com.br',
      logoUrl: '/assets/img/Logo.png',
      rodapeLaudo:
        'Este é um rodapé padrão para todos os laudos. Edite nas configurações.',
    },
  });
  console.log('Default settings seeded.');

  // 3. Usuários iniciais (Admin + Recepcionista)
  for (const cfg of seedUsers) {
    const perfil = await prisma.perfil.findUnique({
      where: { nome_perfil: cfg.perfilNome },
    });
    if (!perfil) {
      console.warn(`[SEED] Perfil "${cfg.perfilNome}" não encontrado, pulando ${cfg.email}.`);
      continue;
    }

    const passwordFromEnv = process.env[cfg.envVar];
    const password = passwordFromEnv ?? cfg.fallback;
    const usingFallback = !passwordFromEnv;

    const hashed = await bcrypt.hash(password, 10);

    // upsert preserva senha de usuário existente (update: {}). Senha só é
    // gravada na criação inicial.
    const result = await prisma.usuario.upsert({
      where: { email: cfg.email },
      update: {},
      create: {
        nome_completo: cfg.nome,
        email: cfg.email,
        hash_senha: hashed,
        id_perfil: perfil.id_perfil,
        // Se fallback: força troca no primeiro acesso (segurança).
        // Se senha veio de env: assume que o operador escolheu intencionalmente.
        primeiro_login: usingFallback,
      },
    });

    if (usingFallback) {
      console.log(
        `[SEED] ${cfg.email} criado com senha temporária. ` +
        `Troca obrigatória no primeiro login. ` +
        `Para definir senha customizada, configure ${cfg.envVar} no .env.`,
      );
    } else {
      console.log(`[SEED] ${cfg.email} criado/atualizado usando ${cfg.envVar}.`);
    }

    // Aviso caso esse upsert tenha tocado um registro existente (não muda senha).
    if (result.data_criacao && new Date(result.data_criacao).getTime() < Date.now() - 60_000) {
      console.log(`       (usuário já existia — senha existente preservada)`);
    }
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
