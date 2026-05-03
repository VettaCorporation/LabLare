# LabLare — Handoff Técnico

**Versão:** 1.0
**Data:** 2026-05-03
**Audiência:** próxima equipe de desenvolvimento, antes da entrega ao cliente.
**Escopo:** estado atual do código, decisões arquiteturais, dívida técnica, backlog priorizado e roadmap até produção.

> Este documento é complementar ao [`README.md`](../README.md) (setup, scripts, troubleshooting) e ao [`CLAUDE.md`](../CLAUDE.md) (convenções de código). Não duplica esses conteúdos — assume que foram lidos.

---

## Índice

1. [Sumário executivo](#1-sumário-executivo)
2. [Visão de produto](#2-visão-de-produto)
3. [Arquitetura](#3-arquitetura)
4. [Mapa do código](#4-mapa-do-código)
5. [Modelo de dados](#5-modelo-de-dados)
6. [Estado atual — o que está pronto](#6-estado-atual--o-que-está-pronto)
7. [Backlog técnico até "pronto pra cliente"](#7-backlog-técnico-até-pronto-pra-cliente)
8. [Operação em produção](#8-operação-em-produção)
9. [Segurança](#9-segurança)
10. [Qualidade e testes](#10-qualidade-e-testes)
11. [Onboarding de novo dev](#11-onboarding-de-novo-dev)
12. [Roadmap até entrega ao cliente](#12-roadmap-até-entrega-ao-cliente)
13. [Anexos](#13-anexos)

---

## 1. Sumário executivo

**O que é o LabLare:** sistema web de gestão para laboratório de análises clínicas (Lare Laboratório). Cobre o ciclo completo: cadastro de paciente, orçamento, solicitação de exames, aprovação, pagamento, coleta, lançamento de resultados, validação de laudo, entrega via portal do paciente.

**Estado:** desenvolvimento ativo, **sem dados de produção** ainda. Build verde, 113 testes unitários passando, auditoria de segurança crítica concluída em maio/2026.

**Prontidão para entrega ao cliente:** ~90%. Sessão de 2026-05-03 fechou:
- 3 gaps funcionais bloqueantes (F1/F2/F3), incluindo **bug crítico** onde lançamento de resultado de exame estava efetivamente quebrado (rota com lógica de pagamento legada e payload incompatível com a página chamadora).
- Configuração de PM2 (D1).
- Template de variáveis de produção (D2).
- Runbook operacional completo (D5 → ver [`DEPLOY.md`](DEPLOY.md)).
- CSP em modo Report-Only (P2.E fase 1) com endpoint `/api/csp-report` para coleta.

| Bloqueador | Severidade | Esforço | Status |
|------------|-----------|---------|--------|
| ~~`ecosystem.config.js` para PM2~~ | BLOQUEANTE | ~~1h~~ | ✅ D1 |
| ~~`.env.production.example` com checklist~~ | BLOQUEANTE | ~~1h~~ | ✅ D2 |
| ~~Procedimento de release documentado~~ | BLOQUEANTE | ~~1h~~ | ✅ D5 → [`DEPLOY.md`](DEPLOY.md) |
| ~~Remover dados mock em UI pública (`FindExams`)~~ | IMPORTANTE | ~~4h~~ | ✅ F1 |
| ~~Implementar `ExameCatalogoFormModal` real~~ | IMPORTANTE | ~~3h~~ | ✅ F2 |
| ~~Consolidar rotas duplicadas de pagamento~~ | BLOQUEANTE | ~~3h~~ | ✅ F3 (bug crítico de lançamento corrigido junto) |
| ~~CSP em Report-Only~~ | RECOMENDADO | ~~2h~~ | ✅ P2.E fase 1 |
| Configurar Nginx + TLS na VPS (D7) | BLOQUEANTE | 3h | ⏳ depende de servidor |
| Configurar backup MySQL automatizado (D3) | BLOQUEANTE | 2h | ⏳ script pronto em [DEPLOY.md §5.2](DEPLOY.md), depende de cron no servidor |
| ~~Cron HTTP para `expirePendingOrcamentos` (D4)~~ | IMPORTANTE | ~~2h~~ | ✅ Endpoint `/api/cron/expire-orcamentos` criado com `X-Cron-Secret` (timing-safe). Falta cadastrar cron no Hostinger. |
| Sentry/observabilidade externa (P2.C) | IMPORTANTE | 1h + conta | ⏳ |
| CI mínimo (GitHub Actions) rodando `test` + `build` | RECOMENDADO | 2h | ⏳ |
| CSP enforcing (após 2-4 semanas em Report-Only) | RECOMENDADO | 1h | ⏳ |

**Total restante até produção:** ~10 homem-horas, sendo ~5h dependentes de acesso ao servidor real (Nginx, backup automatizado, cron).

**Riscos residuais aceitos** (consciente, não bloqueia entrega): rate limit in-memory (single-instance only), sem testes de integração, sem CSP.

---

## 2. Visão de produto

### 2.1 Domínio e fluxo de negócio

```
Paciente chega ao laboratório
   │
Recepcionista cadastra Paciente (CPF, nome, contato)
   │
   ├─ (opcional) cria Orçamento ──────────────────────────┐
   │       │                                              │
   │       └─ paciente aceita → converte em Solicitação   │
   │                                                      │
Recepcionista cria Solicitação direto                     │
   │                                                      │
Solicitação criada com itens (exames + preço snapshot) ◄──┘
   │ status: AGUARDANDO_APROVACAO
   │
Administrador aprova (com desconto opcional)
   │ status: AGUARDANDO_PAGAMENTO
   │
Recepcionista registra Pagamento (PIX / dinheiro / cartão / convênio)
   │ status: PAGO → AGUARDANDO_COLETA
   │
Técnico recebe a amostra física
   │ ItemSolicitacao.status_item: AMOSTRA_RECEBIDA
   │
Técnico lança Resultado (parâmetros do laudo)
   │ status: AGUARDANDO_LAUDO
   │ Laudo.status_laudo: PENDENTE_VALIDACAO
   │
Biomédico/Admin valida ou rejeita laudo
   │ Laudo.status_laudo: VALIDADO (ou REJEITADO → técnico relança)
   │
Quando todos os laudos da Solicitação estão VALIDADOS:
   │ Solicitacao.status: LAUDO_VALIDADO → FINALIZADO
   │
Paciente acessa /portal-paciente e baixa o laudo
```

### 2.2 Perfis de usuário

| Perfil | Login | Acesso | Origem do registro |
|--------|-------|--------|---------------------|
| **Administrador** | email + senha | TUDO no `/dashboard/*` | Cadastrado por outro Admin (seed cria 1 inicial) |
| **Recepcionista** | email + senha | Subset do `/dashboard/*` definido por privilégios | Admin cadastra via tela de Colaboradores |
| **Biomédico** | email + senha | Validação de laudos | Admin cadastra |
| **Técnico** | email + senha | Recebimento amostras + lançamento de resultado | Admin cadastra |
| **Paciente** | **CPF** + senha | `/portal-paciente` (consulta laudos próprios) | Auto-criado quando recepcionista cadastra paciente |

**Privilégios** são granulares por rota (`Privilegio.rota`). Um Recepcionista pode ter `[/dashboard/pacientes, /dashboard/solicitar-exame]` mas não `/dashboard/configuracoes`.

### 2.3 Telas (alto nível)

- **Site público** (não autenticado): `/`, `/home`, `/exames`, `/quem-somos`, `/contato`
- **Auth**: `/login`, `/portal-paciente`, `/esqueci-senha`, `/enter-otp`, `/reset-password`, `/primeiro-acesso`, `/register`
- **Dashboard interno** (29 telas): pacientes, orçamentos, solicitações, aprovação, pedidos, recebimento, lançamento, validação, exames, etiquetas, colaboradores, configurações, logs, privilégios

Mapa completo na seção [4.2](#42-páginas-pagetsx).

---

## 3. Arquitetura

### 3.1 Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 15.5 |
| UI | React + TypeScript | 19 / 5.9 |
| Estilo | Tailwind CSS | 4 |
| ORM | Prisma | 6.19 |
| Banco | MySQL | 8 |
| Auth | NextAuth | 4 |
| Validação | Zod | 4 |
| Testes | Vitest | 4.1 |
| Email transacional | nodemailer (reset/cadastro) + Resend (contato público) | — |
| Charts | Recharts | 3 |

### 3.2 Topologia de deploy esperada

```
                     ┌──────────────────────────────┐
                     │  Hostinger VPS (single host) │
                     │                              │
   Internet ──TLS──► │  Nginx (reverse proxy)       │
                     │       │                      │
                     │       └─► Node.js (PM2 single)│
                     │              │               │
                     │              └─► MySQL 8     │
                     │                              │
                     └──────────────────────────────┘
```

- **Single-instance** intencional. Decisões arquiteturais foram tomadas com isso em mente: rate limit in-memory, expiração lazy de orçamentos.
- **PM2 single mode** (não cluster). Cluster quebraria o rate limit (sem Redis) e não traria ganho real para o volume esperado.
- **MySQL na mesma máquina** — backup vira snapshot do disco + dump diário para storage externo (a definir).

### 3.3 Decisões arquiteturais relevantes

#### D1 — Singleton Prisma global
[`src/lib/prisma.ts`](../src/lib/prisma.ts) usa `globalThis.prisma` em dev (evita esgotamento de pool com hot-reload do Next) e instância única em prod. **Não chame `prisma.$disconnect()` em rotas** — fecha o cliente para todo o processo Node.

#### D2 — Soft-delete em entidades com FK
`Paciente`, `ExameCatalogo` e `Usuario` têm coluna `ativo`. Hard-delete quebraria histórico (uma `Solicitacao` antiga aponta para `Paciente.id`; deletar o paciente apaga histórico financeiro/clínico). Listagens devem **sempre** filtrar `where: { ativo: true }`.

#### D3 — Status: enum forte para Solicitacao, strings para o resto
- `Solicitacao.status` é `enum SolicitacaoStatus` no Prisma. Comparação direta sem casting.
- `ItemSolicitacao.status_item`, `Laudo.status_laudo`, `Orcamento.status` são `String`. **Devem** ser referenciados via constantes em [`src/lib/statuses.ts`](../src/lib/statuses.ts). **Bug histórico:** `'VALIDADO'` (uppercase) vs `'Validado'` (Title Case) zerou o KPI de turnaround do dashboard. Ver `dashboard/stats/route.ts`. **Migração futura para enums Prisma é recomendada** (P2.G abaixo).

#### D4 — Recálculo backend de valores financeiros
Cliente envia apenas `desconto_percentual` (validado em [0, 100]). Backend lê `ItemSolicitacao.preco_item` (snapshot do preço no momento da criação) e recalcula `valor_final` e `valor_pago`. **Cliente nunca envia esses campos.** Já é assim em `solicitacoes/[id]/aprovar` e `solicitacoes/[id]/pagar`. Ver alerta em [§7.3](#73-gaps-funcionais-detectados-no-código) sobre rota duplicada `lancamento-resultados/route.ts`.

#### D5 — Rate limit in-memory
[`src/lib/rateLimit.ts`](../src/lib/rateLimit.ts) usa `Map` no processo Node. Funciona em PM2 single. **Não funciona em cluster nem multi-host.** Para escalar: trocar para Redis com mesma interface. Hoje aplicado em login (admin/recep e paciente), reset de senha e endpoints sensíveis.

#### D6 — Lazy expiry de orçamentos
[`src/lib/jobs/orcamentoExpiry.ts`](../src/lib/jobs/orcamentoExpiry.ts) é chamado pela rota `GET /api/orcamentos`. Em vez de cron job, atualiza `Pendente → Expirado` onde `data_validade < now()` toda vez que alguém lista. **Trade-off:** se ninguém lista por dias, orçamentos expirados aparecem como pendentes em queries diretas. Mitigação recomendada: adicionar cron HTTP no Hostinger (ver [§7.1](#71-bloqueadores-de-produção-deploy-prep)).

#### D7 — Logger estruturado em vez de `console`
[`src/lib/logger.ts`](../src/lib/logger.ts) emite JSON em produção (parseável por agentes de log) e formato legível em dev. **Convenção:** usar `logger.error/warn/info/debug` em código de servidor. Componentes/páginas de cliente podem manter `console.*` (vai pro browser do usuário, não polui logs).

#### D8 — `authOptions` em arquivo separado
Next 15 proíbe export de qualquer coisa além de handlers HTTP em `route.ts`. Por isso `authOptions` mora em [`src/lib/auth.ts`](../src/lib/auth.ts) e [`src/app/api/auth/[...nextauth]/route.ts`](../src/app/api/auth/[...nextauth]/route.ts) é um re-export fino.

#### D9 — Auditoria persistente em `OperacaoLog`
[`src/lib/logService.ts`](../src/lib/logService.ts) persiste ações sensíveis (login sucesso/falha, criação/exclusão de paciente, aprovação de solicitação) em tabela com índice `data_hora DESC`. Tela de visualização: `/dashboard/configuracoes/logs`.

#### D10 — Geração de senha temporária cripto-segura
[`src/lib/passwordGenerator.ts`](../src/lib/passwordGenerator.ts) usa `crypto.randomBytes` com **rejection sampling** (não `% length`, que enviesa). Alfabeto de 32 caracteres sem ambíguos (`0/O/I/1` removidos). Resultado: 10 chars ≈ 50 bits de entropia. Pacientes recebem essa senha com `primeiro_login: true` — middleware força troca em `/primeiro-acesso`.

---

## 4. Mapa do código

### 4.1 Estrutura raiz

```
LabLare/lablare/
├── prisma/
│   ├── schema.prisma           # Modelo de dados
│   ├── migrations/             # 9 migrations cronológicas
│   └── seed.ts                 # Cria perfis, privilégios e admin/recep iniciais
├── src/
│   ├── app/                    # Routes Next.js (App Router)
│   │   ├── api/                # Rotas API
│   │   ├── dashboard/          # UI interna (Admin/Recep/Téc/Bio)
│   │   ├── portal-paciente/    # UI do paciente
│   │   ├── primeiro-acesso/    # Troca obrigatória após 1º login
│   │   ├── login, register, esqueci-senha, enter-otp, reset-password, home, exames, contato, quem-somos
│   │   └── layout.tsx, page.tsx
│   ├── components/             # Componentes React reutilizáveis
│   ├── lib/                    # Lógica de servidor reutilizável
│   ├── utils/                  # Helpers (CPF, formatação, templates de impressão)
│   └── middleware.ts           # Auth guard + redirect 1º acesso
├── tests/
│   └── unit/                   # 113 testes unitários (9 arquivos)
├── scripts/                    # Importação Pardini, privilégios
├── public/assets/              # Imagens, ícones SVG, logo
├── types/next-auth.d.ts        # Augmentation do NextAuth (Session, JWT)
├── docs/HANDOFF.md             # ESTE arquivo
├── README.md                   # Setup e operação
├── CLAUDE.md                   # Convenções de código
├── next.config.ts              # Headers de segurança + cache
├── tsconfig.json               # strictNullChecks ativo
├── vitest.config.ts            # Setup de testes
└── package.json
```

### 4.2 Páginas (`page.tsx`)

| Rota | Perfil | Estado | Observações |
|------|--------|--------|-------------|
| `/` | Público | OK | Redireciona para `/home` |
| `/home` | Público | OK | Landing (Hero + Stats + Exames + FAQ) |
| `/exames` | Público | OK | Catálogo público |
| `/quem-somos` | Público | OK | Sobre + FAQ |
| `/contato` | Público | OK | Formulário (envia via Resend) |
| `/login` | Público | OK | Login Admin/Recep/Téc/Bio (email) |
| `/portal-paciente` | Público | OK | Login Paciente (CPF) |
| `/register` | Admin | OK | Cadastrar colaborador |
| `/esqueci-senha` → `/enter-otp` → `/reset-password` | Público | OK | Fluxo OTP |
| `/primeiro-acesso` | Autenticado c/ flag | OK | Forçada — middleware redireciona |
| `/dashboard` | Admin | OK | KPIs + gráficos + recentes |
| `/dashboard/pacientes` | Admin/Recep | OK | CRUD paciente |
| `/dashboard/solicitar-exame` | Admin/Recep | OK | Solicitação direta |
| `/dashboard/orcamento` | Admin | OK | Lista + KPIs orçamentos |
| `/dashboard/orcamento/novo` | Admin/Recep | OK | Criação |
| `/dashboard/solicitacoes/[id]` | Admin | OK | Detalhe + edição |
| `/dashboard/solicitacoes/[id]/visualizar-exames` | Admin | OK | Por origem (LARE/PARDINI) + etiqueta |
| `/dashboard/aprovar-solicitacoes` | Admin | OK | Fila aprovação |
| `/dashboard/pedidos` | Admin/Recep | OK | Pagamento |
| `/dashboard/recebimento-amostras` | Admin/Téc | OK | Confirmar amostra |
| `/dashboard/lancamento-resultados` | Admin/Téc | OK | Lançar parâmetros |
| `/dashboard/validacao-laudos` | Admin/Bio | OK | Validar/rejeitar |
| `/dashboard/exames`, `/exames/novo`, `/exames/[id]/editar`, `/cadastrar-exames` | Admin | OK | Catálogo (4 telas — possível redundância entre `cadastrar-exames` e `exames/novo`) |
| `/dashboard/etiqueta` | Admin/Recep | OK | Impressão |
| `/dashboard/colaboradores`, `/colaboradores/[id]/editar` | Admin | OK | CRUD colaborador |
| `/dashboard/configuracoes` | Admin | OK | Dados do laboratório |
| `/dashboard/configuracoes/logs` | Admin | OK | OperacaoLog |
| `/dashboard/privilegios` | Admin | OK | Permissões por perfil |

**Total:** 34 páginas. Nenhuma é stub — todas têm lógica funcional. Mas 2 contêm dados mock visíveis ao usuário (ver [§7.3](#73-gaps-funcionais-detectados-no-código)).

### 4.3 Rotas API

Sob [`src/app/api/`](../src/app/api/). Os principais grupos:

| Grupo | Rotas | Observações |
|-------|-------|-------------|
| `auth/` | `[...nextauth]`, `register`, `primeiro-acesso/trocar-senha`, `reset-password/{request,validate-code,reset}`, `perfis` | NextAuth 4 + reset OTP |
| `pacientes/` | `route` (GET/POST), `[id]` (GET/PATCH) | Soft-delete |
| `colaboradores/` | `route` (GET/POST), `[id]` (GET/PATCH/DELETE) | |
| `exames/`, `exames-catalogo/` | CRUD do catálogo | |
| `solicitacoes/` | `route`, `[id]`, `[id]/aprovar`, `[id]/recusar`, `[id]/pagar`, `recebimento` | Fluxo principal |
| `orcamentos/` | `route`, `[id]`, `[id]/converter`, `stats` | Lazy expiry no GET |
| `lancamento-resultados/` | `route`, `pendentes` | ⚠️ rota legada com lógica de pagamento — ver §7.3 |
| `laudos/` | `pendentes`, `[id]/aprovar` | |
| `pagamentos/` | `recentes` | ⚠️ stub 410 — ver §7.3 |
| `dashboard/stats`, `logs`, `notificacoes` | Painéis e auditoria | |
| `send` | Formulário público de contato (Resend) | Lazy-init, retorna 503 sem chave |

### 4.4 Bibliotecas internas (`src/lib/`)

| Arquivo | Propósito |
|---------|-----------|
| [`prisma.ts`](../src/lib/prisma.ts) | Singleton Prisma |
| [`auth.ts`](../src/lib/auth.ts) | `authOptions` do NextAuth (2 providers: admin/recep e paciente) |
| [`logger.ts`](../src/lib/logger.ts) | Logger estruturado (JSON em prod) |
| [`logService.ts`](../src/lib/logService.ts) | Auditoria em `OperacaoLog` (`registrarLog`, `ACAO_LOG`) |
| [`rateLimit.ts`](../src/lib/rateLimit.ts) | Rate limit + extração de IP |
| [`statuses.ts`](../src/lib/statuses.ts) | Constantes de status (`STATUS_ITEM`, `STATUS_LAUDO`, `STATUS_ORCAMENTO`) |
| [`passwordGenerator.ts`](../src/lib/passwordGenerator.ts) | Senha temporária cripto-segura (10 chars) |
| [`schemas/common.ts`](../src/lib/schemas/common.ts) | Zod schemas reutilizáveis + `parseJson` helper |
| [`schemas/{auth,pacientes,solicitacoes,orcamentos}.ts`](../src/lib/schemas/) | Schemas de domínio |
| [`jobs/orcamentoExpiry.ts`](../src/lib/jobs/orcamentoExpiry.ts) | `expirePendingOrcamentos()` |

---

## 5. Modelo de dados

### 5.1 Entidades

| Entidade | Propósito | Soft-delete | Timestamps |
|----------|-----------|:-----------:|:----------:|
| **Perfil** | Agrupador de privilégios (Admin/Recep/Téc/Bio/Paciente) | — | — |
| **Privilegio** | Permissão granular por rota | — | — |
| **Usuario** | Login (colaborador via email, paciente via cpf_login) | ✅ | createdAt |
| **Paciente** | Dados clínicos/contato do paciente | ✅ | data_cadastro |
| **ExameCatalogo** | Catálogo (nome, preço, origem LARE/PARDINI) | ✅ | — |
| **Solicitacao** | Pedido de exames | — | data_hora_solicitacao |
| **ItemSolicitacao** | Item dentro de solicitação (snapshot de preço) | — | — |
| **Pagamento** | Registro financeiro associado | — | data_pagamento |
| **Laudo** | Resultado de um item (1:1 com ItemSolicitacao) | — | data_lancamento, data_validacao |
| **ParametroResultado** | Linha de resultado (nome, valor, unidade, ref) | — | — |
| **Orcamento** | Pré-venda com validade | — | data_criacao |
| **OrcamentoItem** | Item dentro do orçamento | — | — |
| **Notificacao** | Push interno (com `lida` boolean e `rota_link`) | — | data_criacao |
| **OperacaoLog** | Auditoria persistente | — | data_hora |
| **Configuracao** | Singleton (id=1) com dados do laboratório | — | — |

**15 entidades. ~30 índices ativos.** Schema completo em [`prisma/schema.prisma`](../prisma/schema.prisma).

### 5.2 Diagrama relacional (ASCII)

```
Perfil ──N:M── Privilegio
  │
  └─1:N─► Usuario
            │
            ├─1:0..1─► Paciente (via cpf_login = cpf)
            │            │
            │            ├─1:N─► Solicitacao
            │            │         │
            │            │         ├─1:N─► ItemSolicitacao ──N:1──► ExameCatalogo
            │            │         │            │
            │            │         │            └─1:1─► Laudo
            │            │         │                      │
            │            │         │                      └─1:N─► ParametroResultado
            │            │         │
            │            │         └─1:N─► Pagamento
            │            │
            │            └─1:N─► Orcamento
            │                       │
            │                       └─1:N─► OrcamentoItem ──N:1──► ExameCatalogo
            │
            ├─1:N─► OperacaoLog (id_usuario nullable, SET NULL on delete)
            └─1:N─► Notificacao
```

### 5.3 Constraints e regras de integridade

**Unique:** `Perfil.nome_perfil`, `Usuario.email` (nullable), `Usuario.cpf_login` (nullable), `Usuario.reset_password_token`, `Paciente.cpf`, `Paciente.email` (nullable), `ExameCatalogo.codigo_pardini` (nullable), `ExameCatalogo.codigo_lare` (nullable), `Laudo.id_item_solicitacao`, `Privilegio.rota`.

**ON DELETE strategies:**
- `RESTRICT` em FKs que protegem histórico (Paciente↔Solicitacao, ExameCatalogo↔ItemSolicitacao, Solicitacao↔Pagamento). É por isso que precisamos de soft-delete.
- `SET NULL` em FKs opcionais (Solicitacao.id_aprovador, Laudo.id_tecnico, Laudo.id_biomedico_validador, OperacaoLog.id_usuario).
- Inserções no Notificacao bloqueiam exclusão de Usuário (`RESTRICT`).

**Defaults importantes:**
- `Usuario.ativo`, `Paciente.ativo`, `ExameCatalogo.ativo`: `true`
- `Usuario.primeiro_login`: `false` (seed grava `true` para forçar troca)
- `Solicitacao.status`: `AGUARDANDO_APROVACAO`
- `Orcamento.status`: `'Pendente'`
- `Laudo.status_laudo`: `'Aguardando Lançamento'`
- `ItemSolicitacao.status_item`: `'Aguardando Coleta'`
- `Notificacao.lida`: `false`
- `ExameCatalogo.origem`: `LARE`

### 5.4 Migrations cronológicas

| # | Timestamp | Nome | Propósito | Ref. |
|---|-----------|------|-----------|------|
| 1 | 2025-10-13 | `teste` | Schema inicial (13 entidades) | — |
| 2 | 2025-10-21 | `atualizacao_desconto_exame` | `desconto_item` em ItemSolicitacao | — |
| 3 | 2025-10-21 | `add_notificacao` | Tabela Notificacao | — |
| 4 | 2025-11-10 | `novostatus` | +`AGUARDANDO_LAUDO`, `LAUDO_VALIDADO` no enum | — |
| 5 | 2025-11-10 | `adicionar_status_pago` | +`PAGO` no enum | — |
| 6 | 2025-11-12 | `add_tabela_operacao_log` | Tabela `OperacaoLog` para auditoria | P1.1 |
| 7 | 2026-05-03 | `email_opcional_paciente_cpf_login` | `email` nullable em Usuario; migra CPF de email→cpf_login | **P0.8** |
| 8 | 2026-05-03 | `soft_delete_paciente_exame` | `ativo` em Paciente e ExameCatalogo + índices | **P0.9** |
| 9 | 2026-05-03 | `indices_queries_quentes` | 9 índices em queries quentes | **G1** |

**Regra:** nunca editar migration aplicada. Sempre criar nova. Convenção de nome: `YYYYMMDDHHMMSS_descricao_em_snake_case_pt-br_ok`.

### 5.5 Status: enums e constantes

`Solicitacao.status` é **enum Prisma** — strong typing:

```ts
enum SolicitacaoStatus {
  AGUARDANDO_APROVACAO, AGUARDANDO_COLETA, FINALIZAR_PAGAMENTO,
  AGUARDANDO_PAGAMENTO, PAGO, AGUARDANDO_LAUDO,
  LAUDO_VALIDADO, FINALIZADO, CANCELADO
}
```

Demais status são **strings com constantes** em [`src/lib/statuses.ts`](../src/lib/statuses.ts):

```ts
STATUS_ITEM      = { AGUARDANDO_COLETA: 'Aguardando Coleta',
                     AMOSTRA_RECEBIDA: 'Amostra Recebida',
                     RECEBIDA_AREA_TECNICA: 'Recebida pela área técnica' }

STATUS_LAUDO     = { AGUARDANDO_LANCAMENTO: 'Aguardando Lançamento',
                     PENDENTE_VALIDACAO: 'Pendente de Validação',
                     VALIDADO: 'Validado',
                     REJEITADO: 'Rejeitado' }

STATUS_ORCAMENTO = { PENDENTE: 'Pendente',
                     APROVADO: 'Aprovado',
                     EXPIRADO: 'Expirado' }
```

⚠️ **Nunca usar strings literais** (`'Validado'`, `'PENDENTE'`, etc) em queries — bug histórico (B11) zerou KPI por inconsistência de case. Ver violações listadas em [§7.3](#73-gaps-funcionais-detectados-no-código).

---

## 6. Estado atual — o que está pronto

Auditoria técnica de maio/2026 classificou itens em P0 (segurança crítica) / P1 (qualidade) / G (extras) / P2 (estrutural).

### 6.1 P0 — Segurança crítica (11/11 fechados)

| # | Item | Onde |
|---|------|------|
| P0.1 | Rate limiting no `authorize` do NextAuth (5/15min por IP, separado por provider) | [src/lib/auth.ts](../src/lib/auth.ts) |
| P0.2 | Token de reset cripto-seguro (`crypto.randomBytes` + rejection sampling) | [src/app/api/auth/reset-password/](../src/app/api/auth/reset-password/) |
| P0.3 | Cookie httpOnly de reset com escopo `/api/auth/reset-password` | idem |
| P0.4 | Senha temporária de paciente cripto-segura (10 chars, sem ambíguos) | [src/lib/passwordGenerator.ts](../src/lib/passwordGenerator.ts) |
| P0.5 | Forçar troca no 1º login (`primeiro_login=true` + middleware) | [src/middleware.ts](../src/middleware.ts), [/primeiro-acesso/page.tsx](../src/app/primeiro-acesso/page.tsx) |
| P0.6 | Validação Zod em rotas críticas (auth, solicitações) | [src/lib/schemas/](../src/lib/schemas/) |
| P0.7 | Recálculo backend de `valor_final` e `valor_pago` | rotas de solicitações |
| P0.8 | `email` opcional + `cpf_login` único em Usuario | migration `20260503120000` |
| P0.9 | Soft-delete em Paciente, ExameCatalogo, Usuario | migration `20260503130000` |
| P0.10 | Lazy-init Resend (não quebra build sem chave) | [src/app/api/send/route.ts](../src/app/api/send/route.ts) |
| P0.11 | Stubs de rotas órfãs (410) | `pagamentos/recentes` |

### 6.2 P1 — Qualidade (6/6 fechados)

- **P1.1** Logger estruturado ([`src/lib/logger.ts`](../src/lib/logger.ts))
- **P1.2** Rate limit lib reutilizável ([`src/lib/rateLimit.ts`](../src/lib/rateLimit.ts))
- **P1.3** Constantes de status ([`src/lib/statuses.ts`](../src/lib/statuses.ts))
- **P1.4** Zod schemas + `parseJson` helper ([`src/lib/schemas/common.ts`](../src/lib/schemas/common.ts))
- **P1.5** Job lazy de expiração de orçamentos ([`src/lib/jobs/orcamentoExpiry.ts`](../src/lib/jobs/orcamentoExpiry.ts))
- **P1.6** Singleton Prisma ([`src/lib/prisma.ts`](../src/lib/prisma.ts))

### 6.3 G — Extras pós-P1 (4/4 fechados)

- **G1** 9 índices Prisma em queries quentes (migration `20260503140000`)
- **G2** Suite de testes ampliada para **113 unitários em 9 arquivos**
- **G3** Cache headers (`/assets/*` 1 dia, `/api/*` no-store) + security headers ([`next.config.ts`](../next.config.ts))
- **G4** `strictNullChecks: true` ativado no `tsconfig.json`

### 6.4 Compatibilidade Next 15

- `authOptions` extraído de `route.ts` para [`src/lib/auth.ts`](../src/lib/auth.ts) (35 imports atualizados)
- 12 rotas dinâmicas migradas para `params: Promise<{...}>` + `await params`

---

## 7. Backlog técnico até "pronto pra cliente"

### 7.1 Bloqueadores de produção (deploy prep)

Sem isso, não vai pra produção:

| ID | Item | Esforço | Notas |
|----|------|---------|-------|
| **D1** | `ecosystem.config.js` (PM2) com env, name, log paths, restart policy | 1h | Single mode, não cluster |
| **D2** | `.env.production.example` com checklist de variáveis críticas e rotação | 1h | Documentar `openssl rand -base64 32` para `NEXTAUTH_SECRET` |
| **D3** | Estratégia de backup MySQL: dump diário + retenção 30d em storage externo | 2h | Cron + `mysqldump` + scp/rsync |
| **D4** | Cron HTTP no Hostinger chamando `expirePendingOrcamentos` 1x/dia | 2h | Endpoint dedicado com chave secreta no header (não usar mesma chave do Resend) |
| **D5** | Procedimento de release documentado (git pull → `npm ci` → `prisma migrate deploy` → `npm run build` → `pm2 restart`) | 1h | Inclui rollback (snapshot pré-deploy) |
| **D6** | Testar `prisma migrate deploy` em homologação com dump de prod | 2h | Validar que migrations P0 não destroem dados existentes |
| **D7** | Configurar Nginx com TLS (Let's Encrypt), reverse proxy para `localhost:3000`, security headers extras | 3h | Adicionar `gzip`, `client_max_body_size` (uploads), timeouts |
| **D8** | Logrotate dos logs do PM2 (não deixar disco encher) | 1h | |
| **D9** | Smoke test pós-deploy: login, criar paciente, criar solicitação, fluxo completo até laudo validado | 2h | Manual ou Playwright |

**Total D:** ~15h.

### 7.2 P2 — Itens estruturais pendentes

| ID | Item | Esforço | Risco | Bloqueia produção? |
|----|------|---------|-------|:-------------------:|
| **P2.A** | `tsconfig strict: true` completo (eliminar `as any`) — 4 ocorrências hoje | 3-5h | baixo | Não |
| **P2.B** | Testes de integração com `testcontainers` + MySQL ephemeral | 1 sprint | médio | Não |
| **P2.C** | Sentry/OpenTelemetry para observabilidade | 1h + setup conta | baixo | **Recomendado** |
| **P2.D** | Refactor para Clean Architecture (domain/application/infra) | semanas | alto | Não — adiar pós-deploy |
| **P2.E** | CSP enforcing com nonces (atualmente nem Report-Only) | 4h + ajustes | médio | Não — aplicar Report-Only primeiro |
| **P2.F** | Migrar `prisma.seed` para `prisma.config.ts` | trivial após Prisma 7 | nulo | **Bloqueado** — esperar Prisma 7 |
| **P2.G** | Migrar `Laudo.status_laudo` / `Orcamento.status` / `ItemSolicitacao.status_item` de String para enum Prisma | 4h + migration | médio | Não — mas elimina classe inteira de bugs |

### 7.3 Gaps funcionais detectados no código

**BLOQUEANTE para produção:**

> **F1, F2 e F3 foram resolvidos em 2026-05-03.** Mantidos abaixo com nota de fechamento como referência histórica.

| ID | Local | Problema | Status |
|----|-------|----------|--------|
| **F1** | [`src/components/FindExams/FindExams.tsx`](../src/components/FindExams/FindExams.tsx) | Tinha lista de exames hardcoded (Hemograma, Glicose etc.) com preços fake visível na home pública. | ✅ **Resolvido.** Componente reescrito para buscar de `GET /api/exames` (rota pública). Cards "EXAMES MAIS BUSCADOS" renomeados para "EXAMES DISPONÍVEIS" (sem métrica que ainda não existe). Skeleton de loading + estado vazio + erro. Badge mock "COBERTO POR CONVÊNIOS" removido. |
| **F2** | [`src/components/ExameCatalogoFormModal/ExameCatalogoFormModal.tsx`](../src/components/ExameCatalogoFormModal/ExameCatalogoFormModal.tsx) | Stub que mostrava "ainda não foi implementada". | ✅ **Resolvido.** Form completo com `react-hook-form` + Zod ([`schemas/exames.ts`](../src/lib/schemas/exames.ts)), campos nome/preço/código LARE/descrição, integração com `POST /api/exames-catalogo`, toast de feedback, fechamento ao clicar fora. Cadastros completos (origem PARDINI, código Pardini) seguem em "Configurações → Gestão de Exames" — mantido como decisão de UX (modal é cadastro RÁPIDO). |
| **F3** | [`src/app/api/lancamento-resultados/route.ts`](../src/app/api/lancamento-resultados/route.ts) | **Bug crítico descoberto durante a correção.** A rota não era apenas duplicada — estava com **lógica de pagamento legada** que recebia `valor_pago` do cliente, mas a página `/dashboard/lancamento-resultados` enviava payload de **lançamento de resultado** (`id_item_solicitacao + resultados[] + observacoes_tecnico`). Isso significa que a feature central de lançamento de laudo **estava efetivamente quebrada** — qualquer técnico que clicasse "Enviar para Validação" recebia erro "Dados de pagamento são obrigatórios". | ✅ **Resolvido.** Rota reescrita do zero com lógica real: valida sessão + perfil (Admin ou Técnico de Laboratório), valida payload com Zod ([`schemas/laudos.ts`](../src/lib/schemas/laudos.ts)), checa `status_item === AMOSTRA_RECEBIDA` e `laudo === null`, cria Laudo (`status_laudo: PENDENTE_VALIDACAO`) + ParametroResultado em transação, atualiza `status_item: RECEBIDA_AREA_TECNICA`, promove Solicitação para `AGUARDANDO_LAUDO` quando todos os itens têm laudo, registra log de auditoria (`LAUDO_LANCADO`). Lógica de pagamento permanece autoritativa apenas em [`solicitacoes/[id]/pagar/route.ts`](../src/app/api/solicitacoes/%5Bid%5D/pagar/route.ts). |

**IMPORTANTE (mas não bloqueante):**

> F4, F5 e F9 foram resolvidos em 2026-05-03.

| ID | Local | Problema | Status |
|----|-------|----------|--------|
| **F4** | [`src/app/dashboard/orcamento/page.tsx`](../src/app/dashboard/orcamento/page.tsx) | Strings literais `'Pendente'`, `'Aprovado'`, `'Expirado'`. | ✅ **Resolvido.** Substituídas por `STATUS_ORCAMENTO.PENDENTE/APROVADO/EXPIRADO`. |
| **F5** | [`src/app/solicitacoes/page.jsx`](../src/app/solicitacoes/page.jsx) | Switch com strings hardcoded de status, **incluindo cases zumbis** (`PENDENTE_DE_VALIDACAO`, `VALIDADO`, `LIBERADA`) que não existem no enum `SolicitacaoStatus` — código morto que nunca disparava. | ✅ **Resolvido.** Importado `SolicitacaoStatus` de `@prisma/client`, todos os cases mapeados para valores reais do enum (incluindo `LAUDO_VALIDADO`, `FINALIZADO`, `CANCELADO`, `AGUARDANDO_LAUDO` que estavam ausentes). |
| **F6** | [`src/app/api/pagamentos/recentes/route.ts`](../src/app/api/pagamentos/recentes/route.ts) | Rota stub 410. Decidir: implementar ou remover de vez. | ⏳ |
| **F7** | [`src/components/MapComponent/MapComponent.tsx`](../src/components/MapComponent/MapComponent.tsx) | 4 `as any` (linhas 23, 62, 71). | ⏳ |
| **F8** | [`src/app/dashboard/solicitacoes/[id]/page.tsx:237`](../src/app/dashboard/solicitacoes/%5Bid%5D/page.tsx) | `selectedExams={examesEditados as any}`. | ⏳ |
| **F9** | `dashboard/cadastrar-exames/` redundante com `dashboard/exames/novo/`. | ✅ **Resolvido.** `cadastrar-exames/page.tsx` substituído por redirect server-side para `/dashboard/exames` (não-destrutivo: preserva bookmarks antigos, elimina duplicação de UI). Tela "moderna" com origem PARDINI/LARE e código Pardini fica em `/dashboard/exames/novo`. |
| **F10** | [`src/app/api/solicitacoes/recebimento/route.ts:61`](../src/app/api/solicitacoes/recebimento/route.ts) | Logger marca erro como "(legacy)". | ⏳ |

**COSMÉTICO:**

| ID | Local | Problema |
|----|-------|----------|
| **F11** | 23+ arquivos client em `src/app/dashboard/**/page.tsx` e `src/components/**/*.tsx` | `console.error` em código de cliente. **Não é violação** (convenção permite em browser), mas vale trocar pelos toasts já existentes (`react-toastify`) onde for erro de UX. Não fazer em massa — só onde fizer sentido. |

### 7.4 Gaps de teste (priorizados)

Detalhamento em [§10](#10-qualidade-e-testes). Lacunas mais críticas:

- Auth: callbacks JWT/session, primeiro acesso, reset OTP
- Financeiro: `solicitacoes/[id]/aprovar` (desconto), `solicitacoes/[id]/pagar` (forma_pagamento)
- Orçamentos: criação com `validadeDias`, conversão em solicitação, expiração lazy
- Pacientes: criação com CPF + senha temporária + `primeiro_login`
- Middleware: redirect `primeiro_login` e privilégios

---

## 8. Operação em produção

### 8.1 Variáveis de ambiente

**Críticas (bloqueia execução):**

| Variável | Propósito | Como gerar/obter |
|----------|-----------|------------------|
| `DATABASE_URL` | Conexão MySQL | `mysql://user:senha@host:3306/lablare` — **usuário com permissão limitada** (sem DROP/CREATE em prod) |
| `NEXTAUTH_SECRET` | Assinatura JWT | `openssl rand -base64 32` — **rotacionar invalida sessões** |
| `NEXTAUTH_URL` | URL canônica | `https://app.lablare.com.br` (ou domínio escolhido) |
| `NODE_ENV` | Modo execução | `production` (habilita HSTS, log JSON, esconde stack traces) |

**Importantes:**

| Variável | Propósito | Default |
|----------|-----------|---------|
| `LOG_LEVEL` | Verbosidade | `info` em prod, `debug` em dev |
| `EMAIL_SMTP_HOST/PORT/SECURE/USER/PASS` | Reset de senha + cadastro paciente | — |
| `EMAIL_FROM_NAME/ADDRESS` | Remetente | "LabLare" / `noreply@lablare.com.br` |
| `RESEND_API_KEY` | Form público de contato (lazy-init: 503 se faltar) | opcional |

**Apenas para seed (não rodar seed em prod com dados):**

- `SEED_ADMIN_PASSWORD`, `SEED_RECEP_PASSWORD` — fallback é `TrocarSenha@2026` com `primeiro_login=true`.

### 8.2 Backups

**A definir antes do go-live.** Recomendação:

- **Diário (full):** `mysqldump --single-transaction --routines lablare | gzip > backup-$(date +%F).sql.gz`
- **Retenção:** 30 dias local + replicação para storage externo (S3/B2/Spaces).
- **RPO (perda aceitável):** 24h.
- **RTO (tempo até voltar):** 2h.
- **Teste de restore:** mensal — restaurar dump em ambiente de homologação. Sem teste regular, backup é teatro.

### 8.3 Logs e observabilidade

**Hoje:**
- Stdout JSON em produção (PM2 captura).
- `OperacaoLog` no banco (auditoria de ações sensíveis).

**Falta:**
- Encaminhamento para agente externo (Loki, Datadog, Better Stack...). Mais simples: configurar PM2 `log-rotate` + tail local; alertas básicos via cron.
- **Sentry** (P2.C) para captura de exceções não tratadas. **Recomendo configurar antes do go-live** — sem isso, erros silenciosos vão passar.

### 8.4 Runbook de incidentes comuns

| Sintoma | Diagnóstico | Ação |
|---------|-------------|------|
| App não responde | `pm2 status` mostra app `errored` ou `stopped` | `pm2 logs <app>` → ler erro → corrigir → `pm2 restart` |
| App responde mas DB falha | `Can't reach database server` nos logs | `systemctl status mysql` → restart se preciso. Verificar disco cheio. |
| Login retorna 401 sem motivo | `NEXTAUTH_SECRET` foi rotacionado sem invalidar sessões — usuários relogam | Esperado se houve rotação intencional. Caso contrário: comunicar usuários. |
| Login bloqueia `Muitas tentativas` | Rate limit ativou (5 falhas em 15min do mesmo IP) | Aguardar janela ou (se for ataque real) bloquear IP no Nginx |
| Disco cheio | Logs PM2 sem rotação | Configurar `pm2-logrotate`. Limpar logs antigos. |
| Migrations bloqueando deploy | `prisma migrate deploy` falha por estado divergente | **Não usar** `migrate dev` em prod. Investigar diff: `prisma migrate status`. Se necessário: `migrate resolve --applied`/`--rolled-back`. |
| Orçamentos pendentes não expiram | Cron HTTP não foi configurado (D4) | Chamar `GET /api/orcamentos` força lazy expiry. Configurar cron ASAP. |
| Email de reset não chega | SMTP creds erradas ou rate limit do provedor | Logs mostram erro de SMTP. Validar credenciais. Rate limit em `auth/reset-password/request` é 5/15min. |

### 8.5 Procedimento de release

```bash
# Em homologação (sempre antes de prod):
git pull origin main
npm ci                              # ci, não install (lockfile-respecting)
npx prisma migrate deploy
npm run build
npm run test                        # bloqueia se falhar
pm2 restart lablare-staging

# Smoke test manual: login admin + criar paciente + criar solicitação

# Em produção, com janela de manutenção combinada:
mysqldump ... > pre-deploy-$(date +%F-%H%M).sql.gz   # backup pré
git pull origin main
npm ci
npx prisma migrate deploy            # ⚠️ revisar SQL antes
npm run build
pm2 reload lablare-prod              # reload é zero-downtime; restart força
pm2 save                             # persiste estado para reboot
```

**Rollback rápido:** se algo der errado em <5min: `git checkout <commit-anterior>` + `npm ci` + `npm run build` + `pm2 reload`. Se schema mudou: restaurar dump pré-deploy. Por isso D3 (backup) e D6 (testar migrations) são bloqueantes.

---

## 9. Segurança

### 9.1 Modelo de ameaças

| Atacante | Vetor | Mitigação |
|----------|-------|-----------|
| **Externo anônimo** | Brute-force login | Rate limit 5/15min por IP no `authorize` |
| | Brute-force OTP de reset | Rate limit em `request` + token httpOnly de uso único |
| | XSS via formulários | React escapa por padrão; sem `dangerouslySetInnerHTML` em conteúdo de usuário |
| | CSRF | NextAuth v4 tem proteção CSRF nativa em providers credentials |
| | Clickjacking | `X-Frame-Options: DENY` |
| | SQL injection | Prisma com queries parametrizadas — sem `prisma.$queryRaw` em código auditado |
| | Inspeção de erros | Mensagens genéricas no body; stack traces apenas em log servidor |
| **Paciente malicioso** | Tentar enxergar laudo de outro | Filtros backend: `where: { id_usuario: session.user.id }` em todas as queries de paciente. **Verificar em PR review.** |
| | Escalonamento de privilégio (paciente vira admin) | Middleware bloqueia paciente em `/dashboard/*`; provider de paciente recusa se `nome_perfil !== 'Paciente'` |
| | Manipular `valor_final`/`valor_pago` no payload | D4: backend recalcula |
| **Insider (colaborador)** | Privilégios além do necessário | Sistema de privilégios por rota; Admin é único com acesso total |
| | Apagar dados | Soft-delete + auditoria em `OperacaoLog` |
| | Senha fraca | Zod `strongPasswordSchema` (mínimo 8, 1 maiúscula, 1 especial) |

### 9.2 Mitigações implementadas (resumo)

- ✅ Headers de segurança ([`next.config.ts`](../next.config.ts)): `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS em prod
- ✅ Rate limit no login (admin/paciente), reset, register
- ✅ Tokens cripto-seguros (`crypto.randomBytes` + rejection sampling)
- ✅ Cookie httpOnly de reset com escopo restrito
- ✅ Senha temporária forçada a trocar no 1º login
- ✅ Validação Zod em rotas críticas
- ✅ Recálculo backend de valores financeiros
- ✅ Soft-delete preserva histórico e auditoria
- ✅ `OperacaoLog` persistente
- ✅ Logger estruturado (sem vazar secrets em log dev)

### 9.3 Riscos residuais aceitos

- **Rate limit in-memory:** se algum dia escalar para cluster/multi-host, rate limit fica inefetivo. Hoje ok (single-instance).
- **Sem CSP:** XSS hoje depende de React escapar tudo. Se algum componente futuro usar `innerHTML` ou similar, perde a defesa em profundidade. P2.E mitiga.
- **Sem WAF/CDN:** ataque volumétrico contra o VPS direto pode tirar o app do ar. Cloudflare na frente resolve, mas não está configurado.
- **Sem 2FA:** colaborador com senha vazada = acesso total ao perfil. Aceitável dado o porte do laboratório, revisar pós-deploy.
- **Stack traces em log:** `logger.error` recebe o objeto `Error` completo. Cuidado em prod: não logar req body cru (pode conter senha).

---

## 10. Qualidade e testes

### 10.1 Cobertura atual

113 testes unitários em 9 arquivos (Vitest 4.1, V8 coverage). Todos passando. Sem CI configurado ainda.

| Arquivo | # Testes | Cobre |
|---------|---------:|-------|
| [`tests/unit/cpfFormatter.test.ts`](../tests/unit/cpfFormatter.test.ts) | 11 | Formatação de CPF |
| [`tests/unit/cpfValidator.test.ts`](../tests/unit/cpfValidator.test.ts) | 7 | Validação de dígito verificador |
| [`tests/unit/currencyFormatter.test.ts`](../tests/unit/currencyFormatter.test.ts) | 8 | Formatação monetária |
| [`tests/unit/logger.test.ts`](../tests/unit/logger.test.ts) | 6 | Emissão de logs |
| [`tests/unit/passwordGenerator.test.ts`](../tests/unit/passwordGenerator.test.ts) | 4 | Senha cripto-segura |
| [`tests/unit/rateLimit.test.ts`](../tests/unit/rateLimit.test.ts) | 8 | Rate limit + extração IP |
| [`tests/unit/schemas-common.test.ts`](../tests/unit/schemas-common.test.ts) | 28 | Zod (CPF, email, senha, money, percent, parseJson) |
| [`tests/unit/schemas-domain.test.ts`](../tests/unit/schemas-domain.test.ts) | 28 | Zod (auth, solicitações, orçamentos, pacientes) |
| [`tests/unit/statuses.test.ts`](../tests/unit/statuses.test.ts) | 13 | Constantes de status |

**Cobertura é apenas de helpers/libs puras.** Rotas API, middleware e components: **0% de teste**.

### 10.2 Gaps de teste por prioridade

**P0 (testar antes de produção):**

| Alvo | Por quê |
|------|---------|
| `lib/auth.ts` (callbacks `jwt` e `session`) | Privilégios e `primeiro_login` viajam aqui. Mock Prisma + verificar populate. |
| `middleware.ts` | Redirect `primeiro_login`, separação paciente/interno, privilégios. |
| `POST /solicitacoes/[id]/aprovar` | Cálculo de desconto + transição de status. |
| `POST /solicitacoes/[id]/pagar` | Forma de pagamento + valor_pago recalculado. |
| `POST /orcamentos` | `validadeDias` (1-365), desconto. |
| `GET /orcamentos` (chama `expirePendingOrcamentos`) | Lazy expiry idempotente. |
| `POST /pacientes` | CPF único, soft-delete, geração de senha temporária. |

**P1 (testar pós go-live, primeiros sprints):**

- Reset de senha (request → validate-code → reset)
- `lib/logService.ts` (auditoria)
- Conversão orçamento → solicitação
- Validação de laudo

### 10.3 Estratégia recomendada

1. **Integração com testcontainers** (P2.B): MySQL ephemeral via Docker. Cada suite roda migrations + seed mínimo, exercita rota real, valida estado no banco. Cobre P0 acima.
2. **Component tests** (RTL + Vitest): formulários críticos (`PacienteCadastroForm`, `SolicitacaoExameForm`, `ExameSelection`). Validar formatadores de CPF/dinheiro inline.
3. **E2E** (Playwright): 3 fluxos de fumaça — primeiro acesso forçado, criação completa de solicitação até laudo validado, fluxo paciente (login + ver laudo).
4. **CI mínimo**: GitHub Actions com `npm ci && npm run build && npm test` em PR. Bloqueia merge se falhar. Sem isso, regressões passam.
5. **Coverage thresholds**: 80% lines, 75% functions, 70% branches. Após implementar P0 acima.

### 10.4 Configuração atual

`vitest.config.ts`: alias `@/*` → `src/*`, environment `node`, coverage provider V8 (text + html), include `src/lib/**` e `src/utils/**`. **Sem thresholds configurados.**

Scripts em `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## 11. Onboarding de novo dev

Tempo estimado até primeiro PR: **meio dia**.

### 11.1 Pré-requisitos (15 min)

- [ ] Node.js 20+ (testado em 24)
- [ ] MySQL 8 local rodando na porta 3306
- [ ] Git, npm 10+
- [ ] VS Code (ou IDE com TypeScript)

### 11.2 Setup (30 min)

```bash
git clone <url>
cd lablare
npm install                                # postinstall roda prisma generate
cp .env.example .env                       # editar DATABASE_URL e NEXTAUTH_SECRET
npx prisma migrate dev                     # cria DB e aplica migrations
npx prisma db seed                         # cria perfis + admin/recep
npm run dev                                # http://localhost:3000
```

Login inicial: `admin@test.com` / `TrocarSenha@2026` (ou `SEED_ADMIN_PASSWORD`).
Sistema redireciona para `/primeiro-acesso` para forçar troca.

### 11.3 Leitura obrigatória (1h)

1. Este `HANDOFF.md` (você está aqui)
2. [`README.md`](../README.md) — operação básica e troubleshooting
3. [`CLAUDE.md`](../CLAUDE.md) — convenções de código (singleton Prisma, status constants, logger, parseJson, soft-delete, valores financeiros)
4. [`prisma/schema.prisma`](../prisma/schema.prisma) — modelo de dados completo
5. [`src/lib/auth.ts`](../src/lib/auth.ts) e [`src/middleware.ts`](../src/middleware.ts) — entender autenticação

### 11.4 Tour de código sugerido (1h)

- Abrir [`src/app/api/solicitacoes/[id]/aprovar/route.ts`](../src/app/api/solicitacoes/%5Bid%5D/aprovar/route.ts) — exemplo canônico de rota: `getServerSession` + Zod + Prisma transaction + `registrarLog`.
- Abrir [`src/app/dashboard/orcamento/novo/page.tsx`](../src/app/dashboard/orcamento/novo/page.tsx) — exemplo canônico de tela: form com `react-hook-form` + Zod + chamada API + toast.
- Abrir [`tests/unit/schemas-domain.test.ts`](../tests/unit/schemas-domain.test.ts) — exemplo canônico de teste.

### 11.5 Primeiro PR

- Pegar item de [§7.3 IMPORTANTE](#73-gaps-funcionais-detectados-no-código): F4 ou F5 (substituir strings literais por `STATUS_X`). Trabalho pequeno, encosta em padrões críticos.
- Rodar `npm run lint && npm run test && npm run build` antes de abrir PR.

### 11.6 Padrões a memorizar (de `CLAUDE.md`)

- Nunca `console.error` em rota — use `logger`
- Nunca `prisma.$disconnect()` em rota
- Nunca strings literais de status — use constantes
- Nunca confiar em `valor_final`/`valor_pago` do cliente
- Nunca hard-delete em entidade com `ativo`
- Sempre `getServerSession(authOptions)` em rota sensível
- Sempre validar body com `parseJson(req, schema)`
- Sempre registrar operação sensível com `registrarLog`

---

## 12. Roadmap até entrega ao cliente

### Fase 1 — Hardening (semana 1)

**Objetivo:** sistema pronto para receber o piloto.

- [ ] D1-D5 (PM2 config, env example, backup, cron, release process)
- [ ] D7 (Nginx + TLS)
- [ ] F1-F3 (remover mocks, implementar `ExameCatalogoFormModal`, consolidar pagamento)
- [ ] CI mínimo (test + build em PR)
- [ ] Sentry configurado (P2.C)
- [ ] Smoke test manual completo (8 jornadas em [§2.1](#21-domínio-e-fluxo-de-negócio))

**Critério de saída:** deploy em homologação com dados sintéticos, todos os fluxos passam.

### Fase 2 — Beta com cliente piloto (semanas 2-4)

**Objetivo:** rodar com o Lare Laboratório usando dados reais, monitorado.

- [ ] Treinamento dos perfis (Admin, Recep, Téc, Bio) — gravar vídeos de 5min cada
- [ ] Migrar dados existentes do laboratório (se houver) — script dedicado
- [ ] D8-D9 (logrotate, smoke test pós-deploy)
- [ ] Canal direto com cliente para feedback (WhatsApp/email dedicado)
- [ ] Daily check de Sentry e logs nos primeiros 5 dias úteis
- [ ] Bug fixing reativo

**Critério de saída:** 2 semanas sem incidente bloqueante; cliente assina aceite.

### Fase 3 — Endurecimento pós-beta (mês 2)

**Objetivo:** transformar lições do beta em código.

- [ ] Itens IMPORTANTE de [§7.3](#73-gaps-funcionais-detectados-no-código) (F4-F10)
- [ ] P2.A (`strict: true` completo)
- [ ] P2.B (testes de integração nos fluxos financeiros)
- [ ] P2.E (CSP — começar em Report-Only por 1 semana, depois enforcing)
- [ ] P2.G (migrar status string → enum Prisma)
- [ ] Documentar SLAs combinados com cliente

**Critério de saída:** suite de testes cobre fluxos financeiros; CSP enforcing sem violações.

### Fase 4 — Manutenção (contínuo)

- [ ] Dependabot/Renovate ativos (atualizações de segurança)
- [ ] Backup mensalmente testado (restore real)
- [ ] Revisão trimestral de privilégios e auditoria
- [ ] P2.D (Clean Architecture) só se o domínio crescer significativamente

---

## 13. Anexos

### A. Glossário de domínio

| Termo | Significado |
|-------|-------------|
| **Solicitação** | Pedido formal de exames de um paciente. Conjunto de itens. |
| **Item** | Um exame específico dentro de uma solicitação, com preço snapshot e status próprio. |
| **Laudo** | Resultado de UM item. Tem `status_laudo` próprio. 1:1 com Item. |
| **Parâmetro** | Linha de resultado dentro do laudo (ex: "Hemoglobina = 14.2 g/dL"). |
| **Orçamento** | Pré-venda com validade. Pode virar Solicitação. |
| **Snapshot de preço** | `ItemSolicitacao.preco_item` é copiado na criação — mudanças no catálogo não afetam histórico. |
| **Origem LARE/PARDINI** | LARE = laboratório local; PARDINI = enviado ao parceiro para análise. |
| **Soft-delete** | `ativo = false`. Registro permanece no banco para preservar FK e histórico. |
| **Primeiro login** | Flag `primeiro_login=true` força troca de senha em `/primeiro-acesso` antes de qualquer ação. |
| **Privilégio** | Permissão granular por rota (ex: `/dashboard/pacientes`). |

### B. Scripts e jobs

| Script | Comando | Quando rodar |
|--------|---------|---------------|
| Importar catálogo Pardini | `npm run import:exames` | One-shot, ao receber XML do Pardini |
| Atualizar origem Pardini | `npm run update:origem` | Após import:exames se houver inconsistência |
| Importar privilégios padrão | `npm run import:privilegios` | One-shot inicial ou após mudança em rotas |
| Seed | `npx prisma db seed` | Setup local; **não rodar em prod** com dados |
| Migration dev | `npx prisma migrate dev` | Após editar schema.prisma em dev |
| Migration prod | `npx prisma migrate deploy` | Em prod, idempotente |
| Studio | `npx prisma studio` | Inspecionar banco visualmente |

### C. Dependências externas

| Serviço | Uso | Onde está | Conta atual |
|---------|-----|-----------|-------------|
| **Resend** | Form público de contato | [`/api/send`](../src/app/api/send/route.ts) | Lazy-init (503 se faltar) |
| **SMTP (Gmail/customizado)** | Reset de senha + cadastro paciente | nodemailer | Configurar no `.env` |
| **MySQL** | Banco | Hostinger VPS | A configurar |
| **Hostinger VPS** | Hospedagem | — | A configurar |
| **(Futuro) Sentry** | Observabilidade | P2.C | A criar conta |
| **(Futuro) Cloudflare** | CDN/WAF | recomendado | A avaliar |

### D. Checklist pré-deploy (resumido)

- [ ] `npm run build` verde localmente
- [ ] `npm run test` 113/113 passando
- [ ] `npm run lint` sem erros novos
- [ ] `.env.production` revisado, secrets fortes (não default), `NEXTAUTH_SECRET` rotacionado para prod
- [ ] Backup de produção feito **antes** de aplicar migrations
- [ ] `prisma migrate deploy` testado em homologação com dump de prod
- [ ] PM2 `ecosystem.config.js` em vigor com `instances: 1`
- [ ] Nginx com TLS (Let's Encrypt válido) + reverse proxy
- [ ] Logrotate ativo
- [ ] Cron HTTP de `expirePendingOrcamentos` cadastrado
- [ ] Sentry DSN configurado (se P2.C feito)
- [ ] Smoke test manual: login admin + criar paciente + criar solicitação + aprovar + pagar + receber + lançar + validar + paciente vê laudo no portal
- [ ] Comunicação ao cliente: janela de manutenção, contato de plantão, SLA

---

**Fim do handoff.** Em caso de dúvida sobre o porquê de uma decisão, consultar:
1. Comentários no código (especialmente `D{n}` em decisões e `// CORREÇÃO` em fixes históricos).
2. Histórico do git (`git log --grep="P0"`, etc).
3. `CLAUDE.md` para convenções vivas.
4. Em última instância, este documento — válido para o estado em **2026-05-03**.
