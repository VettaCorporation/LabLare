# Guia para o Claude trabalhando neste repositório

Este arquivo é lido automaticamente pelo Claude Code. Contém regras e contexto específicos do LabLare. Para regras gerais, ver instruções globais do usuário.

## Stack e padrões

- **Next.js 15 App Router** + React 19 + TypeScript (strict parcial: `noImplicitReturns`, `noFallthroughCasesInSwitch`)
- **Prisma 6** com **MySQL 8**
- **NextAuth 4** (credentials provider)
- **Tailwind 4**, **Zod**, **Vitest**
- Deploy esperado: **Hostinger VPS** (single-instance Node + PM2)

## Convenções obrigatórias

### Banco de dados

- **SEMPRE** importe `prisma` de `@/lib/prisma` (singleton). Nunca crie `new PrismaClient()` em rotas/libs.
- **NUNCA** chame `prisma.$disconnect()` em rotas — fecha o singleton globalmente. O cliente vive durante todo o processo Node.
- Para soft-delete, use `update({ ativo: false })` em entidades que têm o campo `ativo` (Paciente, ExameCatalogo, Usuario). Listagens devem filtrar `ativo: true`.

### Autenticação e autorização

- Toda rota que toca dados sensíveis precisa começar com `getServerSession(authOptions)`. Sem isso, é vulnerabilidade.
- Provider Admin/Recep: login por `email`. Provider Paciente: login por `cpf_login`.
- `Usuario.email` é opcional (paciente pode não ter). `Usuario.cpf_login` é único e usado para login do paciente.
- Para forçar troca de senha no primeiro login, gravar `primeiro_login: true`. O middleware redireciona automaticamente para `/primeiro-acesso`.

### Logging

- **Não use `console.*`** em código de servidor (rotas, libs, middleware). Use `logger` de `@/lib/logger`:
  ```ts
  import { logger } from '@/lib/logger';
  logger.error('Erro ao X', error, { ctx: 'modulo', userId });
  logger.info('Algo aconteceu', { ctx: 'modulo' });
  ```
- O `ctx` é a categoria/módulo lógico (`auth`, `pacientes`, `solicitacoes`, etc.).
- Frontend (components/pages) pode manter `console.*` — sai no browser do usuário, não polui logs do servidor.

### Validação de payload

- Bodies de POST/PUT devem ser validados com Zod. Use `parseJson(req, schema)` de `@/lib/schemas/common`:
  ```ts
  const parsed = await parseJson(req, mySchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data; // tipado
  ```
- Schemas reutilizáveis (`cpfSchema`, `emailSchema`, `strongPasswordSchema`, `positiveIntSchema`, `moneySchema`, `percentSchema`) estão em `@/lib/schemas/common`.

### Status como constantes

- `Solicitacao.status` é enum Prisma (`SolicitacaoStatus`) — use direto.
- `ItemSolicitacao.status_item`, `Laudo.status_laudo`, `Orcamento.status` são strings livres no schema mas DEVEM ser referenciadas via constantes em `@/lib/statuses`:
  ```ts
  import { STATUS_LAUDO, STATUS_ITEM, STATUS_ORCAMENTO } from '@/lib/statuses';
  // GRAVAR: status_laudo: STATUS_LAUDO.VALIDADO
  // COMPARAR: status === STATUS_ORCAMENTO.PENDENTE
  ```
- **Nunca** escrever literais como `'Validado'`, `'VALIDADO'`, `'Pendente'` em queries — bug histórico (B11) zerou KPI por inconsistência de case.

### Valores financeiros

- `valor_final` e `valor_pago` **NUNCA** vêm do cliente. São recalculados no backend a partir de `ItemSolicitacao.preco_item` (snapshot) ou `Solicitacao.valor_final` (já gravado).
- Cliente envia apenas `desconto_percentual` (validado em [0, 100]). Backend calcula o resto.

### Rate limit

- Para endpoints sensíveis (auth, reset, register, ações em massa), use `checkRateLimit` de `@/lib/rateLimit`:
  ```ts
  const ip = getClientIp(req);
  const rl = checkRateLimit({ key: 'meu-endpoint', clientId: ip, limit: 5, windowMs: 15 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ message: '...' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSeconds) },
    });
  }
  ```
- ⚠️ É **in-memory**. Funciona apenas em single-instance. Em cluster, falha.

### Erros e respostas HTTP

- Não retorne `error.message` ou stack trace bruto no body — vaza estrutura interna do Prisma.
- Logs detalhados: `logger.error(...)` com o objeto error.
- Resposta ao cliente: mensagem genérica (`{ message: 'Erro interno...' }`).
- Erros de validação de domínio (não-internos): retornar 400 com mensagem amigável.

### Auditoria

- Operações sensíveis (login, criação/exclusão de paciente/colaborador, aprovação de solicitação) devem registrar via `registrarLog(idUsuario, ACAO_LOG.X, detalhes)` de `@/lib/logService`. Persiste em `OperacaoLog`.

## Padrões a evitar

- ❌ `console.error` em rotas (use `logger`)
- ❌ `prisma.$disconnect()` em rotas
- ❌ `(session.user as any).campo` quando você pode tipar via `next-auth.d.ts`
- ❌ Strings literais de status (`'Validado'`, `'Pendente'`, etc.) — use constantes
- ❌ Confiar em `valor_final`/`valor_pago` vindo do client
- ❌ Hard delete em entidades com FK (use soft-delete onde existe)
- ❌ Comentários narrativos da história ("// CORREÇÃO: ...", "// MUDANÇA 1: ...") — vão para o PR, não para o código
- ❌ Schemas Prisma autogerados em `src/generated/` — sempre importar de `@prisma/client`

## Migrations

- Nomes de migration seguem `YYYYMMDDHHMMSS_descricao_curta` (timestamp + nome em snake_case PT-BR ok).
- **Não edite** uma migration já aplicada em produção. Crie uma nova.
- Migrations custom (com UPDATE/DELETE de dados) precisam ser idempotentes ou ter cabeçalho documentando pré-requisitos. Ver `20260503120000_email_opcional_paciente_cpf_login` como exemplo.

## Testes

- Rodar: `npm run test`
- Localizados em `tests/unit/`. Cobertura atual: helpers e libs puras (`cpfValidator`, `passwordGenerator`, `rateLimit`, `logger`, `statuses`).
- Testes de integração com banco real **não estão configurados** (postergado para P2). Se for adicionar, considerar `testcontainers` ou um banco de teste separado.

## Deploy

- Ambiente alvo: **Hostinger VPS**, single-instance, PM2 single mode.
- `npm run build` deve passar sem erros TS antes de deployar.
- `npx prisma migrate deploy` (não `migrate dev`) em produção.
- HSTS é ativado apenas com `NODE_ENV=production`.

## Itens postergados (P2)

Quando for trabalhar em algum, ver os comentários respectivos no código:

- `tsconfig strict: true` completo — exigirá ajustar dezenas de `(x as any)`
- Testes de integração com banco real (testcontainers ou MySQL test)
- Sentry/OpenTelemetry para observabilidade em produção
- Refatorar para Clean Architecture (domain/application/infra)
- Job HTTP no Hostinger para `expirePendingOrcamentos` (atualmente é lazy on-read)
- Configuração de CSP enforcing (atualmente nem Report-Only)
- Migrar `prisma.seed` para `prisma.config.ts` (Prisma 7+)

## Histórico de auditoria

Em maio de 2026 o sistema passou por auditoria técnica completa. 11 itens P0 (segurança crítica) e 6 itens P1 (qualidade) foram fechados. Detalhes ficaram nas conversas — quando dúvida, perguntar antes de presumir.
