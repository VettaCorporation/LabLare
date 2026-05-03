# LabLare

Sistema de gestão para laboratório de análises clínicas (Lare Laboratório). Cobre cadastro de pacientes, orçamentos, solicitações de exames, fluxo de coleta e laudos, autenticação por perfil e portal do paciente.

> 📘 **Para próximos desenvolvedores:** ler [`docs/HANDOFF.md`](docs/HANDOFF.md) antes de começar. Cobre arquitetura, decisões, dívida técnica, backlog priorizado e roadmap até produção.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5.9**
- **Prisma 6** + **MySQL 8**
- **NextAuth 4** (credentials provider — Admin/Recepcionista por email + senha; Paciente por CPF + senha)
- **Tailwind CSS 4**
- **Zod** para validação de payloads de API
- **Vitest** para testes unitários

## Pré-requisitos

- Node.js 20+ (testado em 24)
- MySQL 8 rodando localmente (porta 3306 por padrão)
- npm 10+

## Setup local

```bash
git clone <url-do-repo>
cd lablare
npm install
```

Crie um arquivo `.env` na raiz seguindo `.env.example`:

```env
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/lablare"
NEXTAUTH_SECRET="<string aleatória de 32+ caracteres>"
NEXTAUTH_URL="http://localhost:3000"

# SMTP para reset de senha + email de cadastro de paciente (opcional em dev)
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_SECURE="false"
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASS="sua-senha-de-app"
EMAIL_FROM_NAME="LabLare"
EMAIL_FROM_ADDRESS="noreply@lablare.com.br"

# Resend (apenas para o formulário público de contato)
RESEND_API_KEY=""

# Senhas iniciais do seed (opcional — sem isso, usa fallback com primeiro_login=true)
SEED_ADMIN_PASSWORD=""
SEED_RECEP_PASSWORD=""

# Nível de log: debug | info | warn | error (default: info em prod, debug em dev)
LOG_LEVEL="debug"
```

Aplique as migrations e rode o seed:

```bash
npx prisma migrate dev
npx prisma db seed
```

Suba o dev server:

```bash
npm run dev
```

Acesse <http://localhost:3000>.

### Usuários iniciais (criados pelo seed)

| Tipo | Email | Senha | Comportamento |
|------|-------|-------|---------------|
| Administrador | `admin@test.com` | valor de `SEED_ADMIN_PASSWORD` ou `TrocarSenha@2026` | Se usar fallback: `primeiro_login=true` força troca |
| Recepcionista | `recep@test.com` | valor de `SEED_RECEP_PASSWORD` ou `TrocarSenha@2026` | Idem |

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe Next.js em modo dev na porta 3000 |
| `npm run build` | Build de produção |
| `npm start` | Roda build de produção |
| `npm run lint` | Lint do Next.js |
| `npm run test` | Roda suite de testes (Vitest) |
| `npm run test:watch` | Modo watch dos testes |
| `npm run test:coverage` | Cobertura |
| `npx prisma studio` | UI do Prisma para inspecionar o banco |
| `npx prisma migrate dev` | Aplica migrations pendentes (dev) |
| `npx prisma migrate deploy` | Aplica migrations pendentes (prod) |
| `npx prisma db seed` | Popula perfis, configuração e usuários iniciais |
| `npm run import:exames` | Importa catálogo Pardini do XML em `scripts/data/` |
| `npm run import:privilegios` | Importa privilégios padrão |

## Estrutura

```text
src/
├── app/
│   ├── api/                    # Rotas API (Next App Router)
│   │   ├── auth/               # NextAuth + reset de senha + primeiro acesso
│   │   ├── pacientes/
│   │   ├── colaboradores/
│   │   ├── solicitacoes/
│   │   ├── orcamentos/
│   │   ├── laudos/
│   │   └── ...
│   ├── dashboard/              # UI interna (Admin, Recep, Biomédico, Técnico)
│   ├── portal-paciente/        # UI do paciente (login por CPF)
│   ├── primeiro-acesso/        # Tela obrigatória após primeiro login
│   ├── login/, esqueci-senha/, enter-otp/, reset-password/
│   └── home/, exames/, contato/, quem-somos/  # Site público
├── components/                 # Componentes React
├── lib/
│   ├── prisma.ts               # Singleton PrismaClient
│   ├── logger.ts               # Logger estruturado (façade)
│   ├── rateLimit.ts            # Rate limit in-memory por IP
│   ├── logService.ts           # Auditoria persistente em OperacaoLog
│   ├── statuses.ts             # Constantes de status
│   ├── passwordGenerator.ts    # Senha temporária cripto-segura
│   ├── schemas/                # Zod schemas das APIs
│   └── jobs/orcamentoExpiry.ts # Lazy expire de orçamentos
├── utils/                      # Helpers (CPF, formatação, notificação...)
└── middleware.ts               # Auth + força primeiro acesso

prisma/
├── schema.prisma
├── migrations/                 # 9 migrations
└── seed.ts

tests/
└── unit/                       # 113 testes unitários (9 arquivos)

scripts/                        # Scripts de importação (Pardini, privilégios)
```

## Domínio (em alto nível)

```text
Recepcionista cadastra Paciente
  → cria Orçamento (opcional)
    → converte em Solicitação
      → Admin aprova (com desconto opcional)
        → Recepcionista registra Pagamento
          → libera para Coleta
            → Técnico recebe Amostra
              → Técnico lança Resultado (Laudo)
                → Biomédico Valida ou Rejeita
                  → Solicitação Finalizada
```

Status de `Solicitacao` (enum forte): `AGUARDANDO_APROVACAO` → `AGUARDANDO_PAGAMENTO` → `PAGO` → `AGUARDANDO_COLETA` → `AGUARDANDO_LAUDO` → `LAUDO_VALIDADO` → `FINALIZADO`.

Status de `ItemSolicitacao`, `Laudo`, `Orcamento` são strings em [`src/lib/statuses.ts`](src/lib/statuses.ts).

## Segurança

Implementado:

- ✅ Headers de segurança (`X-Frame-Options`, `X-CTO`, `Referrer-Policy`, `Permissions-Policy`, HSTS em prod) em [`next.config.ts`](next.config.ts)
- ✅ Rate limiting in-memory em login, register e reset password ([`src/lib/rateLimit.ts`](src/lib/rateLimit.ts))
- ✅ Tokens de reset cripto-seguros (`crypto.randomBytes` com rejection sampling)
- ✅ Token de reset em cookie httpOnly, escopo `/api/auth/reset-password`
- ✅ Senhas temporárias de paciente geradas aleatoriamente (10 chars, sem ambíguos)
- ✅ Forçar troca de senha no primeiro login (`primeiro_login=true` + middleware redireciona para `/primeiro-acesso`)
- ✅ Validação Zod em rotas críticas (auth, solicitações)
- ✅ Recálculo backend de `valor_final` e `valor_pago` (cliente não pode subvalorizar)
- ✅ Soft-delete em Paciente, ExameCatalogo e Usuario (preserva FK + auditoria)
- ✅ Auditoria persistente de logins e operações sensíveis (`OperacaoLog`)
- ✅ Logger estruturado (JSON em produção)

⚠️ Limitações conhecidas:

- Rate limit é **in-memory** — funciona em deploy single-instance (Hostinger VPS, PM2 single mode). Se rodar em cluster, migrar para Redis.
- `tsconfig` ainda não está em `strict: true` completo. Ativos: `strictNullChecks`, `noImplicitReturns` e `noFallthroughCasesInSwitch`. Falta migrar `as any` espalhados (P2.A).
- Testes cobrem apenas helpers/libs (113 unitários em 9 arquivos). Integração com banco real pendente (P2.B).
- CSP ainda não enforced (nem Report-Only). Pendente P2.E.
- Observabilidade externa (Sentry/OpenTelemetry) pendente P2.C.

## Deploy (Hostinger VPS)

> ⚠️ **TODO:** `ecosystem.config.js` (PM2) e `.env.production.example` ainda não foram criados. Ver itens pendentes em "Status do projeto".

```bash
# Servidor (após git pull / upload):
npm install                  # postinstall roda prisma generate
npx prisma migrate deploy    # aplica migrations idempotentemente
npm run build
pm2 restart <nome_do_app>    # ou systemd, conforme seu setup
```

Variáveis críticas em produção:

- `NEXTAUTH_SECRET` — string aleatória forte (use `openssl rand -base64 32`)
- `DATABASE_URL` — usuário com permissão limitada (sem DROP/CREATE em prod)
- `NODE_ENV=production` — habilita HSTS, log JSON, esconde stack traces
- `LOG_LEVEL=info` (ou `warn`)
- `SEED_ADMIN_PASSWORD` / `SEED_RECEP_PASSWORD` se for rodar seed em prod (improvável)

⚠️ **Não rode `prisma db seed` em produção** a menos que o banco esteja vazio. Em produção use o fluxo normal de cadastro via UI.

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `Can't reach database server at localhost:3306` | MySQL não está rodando | `Get-Service MySQL*` + `Start-Service MySQL80` |
| `Database 'lablare' does not exist` | Banco não criado | `npx prisma migrate dev` (cria automaticamente) |
| `Module not found: '@prisma/client'` | Faltou rodar `prisma generate` | `npx prisma generate` |
| Login do paciente falha mesmo com senha certa | `cpf_login` está NULL no Usuario (legacy pré-migration P0.8) | Aplicar migration `20260503120000_email_opcional_paciente_cpf_login` |
| `npx prisma db seed` não roda nada | Falta `prisma.seed` no `package.json` | Já configurado neste projeto |
| Rate limit bloqueando dev local | 5 tentativas em 15 min — esperar ou reiniciar `npm run dev` | Reiniciar reseta o Map in-memory |
| `POST /api/send` retorna 503 | `RESEND_API_KEY` ausente — Resend é lazy-init (não quebra build) | Setar `RESEND_API_KEY` no `.env` ou ignorar em dev |

## Status do projeto

Auditoria técnica de maio/2026 — itens classificados em P0 (crítico) / P1 (qualidade) / G (extras) / P2 (estrutural).

**Concluídos:**

- ✅ **P0 (11/11)** — rate limit no NextAuth, tokens cripto-seguros, primeiro_login forçado, Zod em rotas críticas, recálculo backend de valores, soft-delete, email opcional, lazy-init Resend, stubs de rotas órfãs.
- ✅ **P1 (6/6)** — logger estruturado, rate limit lib, constantes de status, Zod schemas + `parseJson`, expiração lazy de orçamentos, singleton Prisma.
- ✅ **G (4/4)** — 9 índices Prisma, 113 testes unitários, cache + security headers, `strictNullChecks`.
- ✅ Compat Next 15 — `authOptions` em `@/lib/auth`, 12 rotas dinâmicas com `params: Promise<...>`.

**Pendentes (P2 — opcional):**

- ⏳ **P2.A** — `tsconfig strict: true` completo (eliminar `as any`).
- ⏳ **P2.B** — Testes de integração com banco real (testcontainers).
- ⏳ **P2.C** — Sentry/OpenTelemetry para observabilidade em produção.
- ⏳ **P2.D** — Refactor para Clean Architecture (domain/application/infra).
- ⏳ **P2.E** — CSP enforcing com nonces.
- ⏳ **P2.F** — Migrar `prisma.seed` para `prisma.config.ts` (Prisma 7+).
- ⏳ **Deploy prep** — `ecosystem.config.js` (PM2), `.env.production.example`, cron HTTP para `expirePendingOrcamentos`.

## Licença

Privado — Lare Laboratório.
