# LabLare — Guia de Deploy e Operação

**Audiência:** dev/devops responsável pelo deploy e manutenção em produção.
**Última atualização:** 2026-05-03.

> Este documento é o runbook operacional. Para visão técnica do projeto, ver [`HANDOFF.md`](HANDOFF.md). Para setup local, ver [`../README.md`](../README.md).

---

## Índice

1. [Pré-requisitos do servidor](#1-pré-requisitos-do-servidor)
2. [Primeiro deploy (bootstrap)](#2-primeiro-deploy-bootstrap)
3. [Deploy de atualização (rotina)](#3-deploy-de-atualização-rotina)
4. [Rollback](#4-rollback)
5. [Backups](#5-backups)
6. [Monitoramento e logs](#6-monitoramento-e-logs)
7. [Cron jobs](#7-cron-jobs)
8. [Troubleshooting operacional](#8-troubleshooting-operacional)
9. [Smoke test pós-deploy](#9-smoke-test-pós-deploy)

---

## 1. Pré-requisitos do servidor

### 1.1 Stack mínima no VPS

| Componente | Versão | Notas |
|------------|--------|-------|
| OS | Ubuntu 22.04+ ou Debian 12+ | Hostinger VPS atende |
| Node.js | 20 LTS ou 22 LTS | Testado em 24. Instalar via `nodesource` ou `nvm` |
| MySQL | 8.x | Instalado localmente (mesmo host) |
| Nginx | 1.18+ | Reverse proxy + TLS |
| PM2 | 5.x | `npm i -g pm2` |
| Certbot | latest | Let's Encrypt para TLS |
| Git | 2.x | Para clone/pull do repositório |

### 1.2 Hardening básico recomendado

- [ ] Usuário `deploy` (não-root) com sudo limitado para `systemctl mysql` e `pm2`
- [ ] SSH apenas com chave (sem senha)
- [ ] `ufw` permitindo apenas 22/tcp, 80/tcp, 443/tcp
- [ ] `fail2ban` em SSH e Nginx
- [ ] Atualizações automáticas de segurança (`unattended-upgrades`)
- [ ] MySQL com `bind-address = 127.0.0.1` (não exposto)
- [ ] Logrotate configurado para `/var/log/nginx/*` e PM2

### 1.3 Variáveis de ambiente

Copiar [`.env.production.example`](../.env.production.example) para `.env` no servidor e preencher.
**Nunca comitar.** Já está no `.gitignore`.

Geração de segredos:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# Senha forte para usuário do banco
openssl rand -base64 24
```

---

## 2. Primeiro deploy (bootstrap)

Sequência única, em uma sessão dedicada com janela de manutenção combinada.

### 2.1 Preparar banco

```bash
# Conectar como root MySQL
sudo mysql

# Criar banco e usuário com privilégios mínimos para a app
CREATE DATABASE lablare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lablare_app'@'localhost' IDENTIFIED BY 'SENHA_FORTE_AQUI';
GRANT SELECT, INSERT, UPDATE, DELETE ON lablare.* TO 'lablare_app'@'localhost';

# Usuário privilegiado APENAS para migrations (use durante o deploy, depois revogue ou reset senha)
CREATE USER 'lablare_migrate'@'localhost' IDENTIFIED BY 'OUTRA_SENHA_FORTE';
GRANT ALL PRIVILEGES ON lablare.* TO 'lablare_migrate'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Clonar e instalar

```bash
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
cd /var/www
git clone <url-do-repo> lablare
cd lablare/lablare              # estrutura do monorepo

# Configurar .env (use lablare_migrate temporariamente em DATABASE_URL)
cp .env.production.example .env
nano .env                       # preencher tudo

# Instalar e gerar Prisma client
npm ci                          # postinstall roda prisma generate

# Aplicar migrations COM o usuário privilegiado
npx prisma migrate deploy

# Trocar DATABASE_URL no .env para lablare_app (sem privilégios DDL)
nano .env

# Seed inicial APENAS no primeiro setup (com banco vazio)
SEED_ADMIN_PASSWORD="SenhaForte@2026" SEED_RECEP_PASSWORD="OutraForte@2026" npx prisma db seed

# Build de produção
npm run build

# Criar pasta de logs do PM2
mkdir -p logs
```

### 2.3 Iniciar com PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save                        # persiste estado
pm2 startup systemd             # gerar comando de auto-start, executar conforme instrução
```

### 2.4 Configurar Nginx

```nginx
# /etc/nginx/sites-available/lablare
server {
    listen 80;
    server_name app.lablare.com.br;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.lablare.com.br;

    # TLS via Certbot (preenche estes paths automaticamente)
    ssl_certificate /etc/letsencrypt/live/app.lablare.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.lablare.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Aumenta para uploads de laudos/PDFs (ajustar conforme necessidade)
    client_max_body_size 20M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Compressão (assets do Next já vêm pré-comprimidos, mas vale para JSON de API)
    gzip on;
    gzip_types text/plain application/json application/javascript text/css text/html;

    # Cabeçalhos de segurança extras (a app já manda os principais via next.config.ts;
    # estes são reforço/fallback caso bypass)
    add_header X-Real-IP $remote_addr;
    add_header X-Forwarded-For $proxy_add_x_forwarded_for;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lablare /etc/nginx/sites-enabled/
sudo nginx -t                          # valida sintaxe
sudo systemctl reload nginx
sudo certbot --nginx -d app.lablare.com.br
```

### 2.5 Configurar logrotate do PM2

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

### 2.6 Smoke test (ver §9)

---

## 3. Deploy de atualização (rotina)

**Sempre testar primeiro em homologação.** Sem ambiente de staging? Crie um — ver `env_staging` no [`ecosystem.config.js`](../ecosystem.config.js).

### 3.1 Pré-deploy

```bash
# 1. Backup do banco (NÃO PULAR)
DATE=$(date +%F-%H%M)
mysqldump --single-transaction --routines lablare \
  | gzip > /var/backups/lablare/pre-deploy-$DATE.sql.gz

# 2. Verificar backup foi criado e tem tamanho razoável
ls -lh /var/backups/lablare/pre-deploy-$DATE.sql.gz
```

### 3.2 Deploy

```bash
cd /var/www/lablare/lablare

# 3. Atualizar código
git fetch origin
git log HEAD..origin/main --oneline    # revisar o que vai entrar
git pull origin main

# 4. Instalar dependências (apenas se package-lock mudou)
npm ci

# 5. Aplicar migrations (idempotente — só roda as pendentes)
#    Se houver alguma migration nova, REVISAR o SQL ANTES.
npx prisma migrate status              # ver pendentes
npx prisma migrate deploy

# 6. Build
npm run build

# 7. Reload zero-downtime (PM2 sobe nova instância antes de matar a antiga)
pm2 reload lablare

# 8. Smoke test (§9)
```

### 3.3 Pós-deploy

```bash
# Verificar logs por 2-3 min em busca de erro
pm2 logs lablare --lines 100

# Confirmar saúde
pm2 status
curl -I https://app.lablare.com.br/        # deve retornar 200/302
```

---

## 4. Rollback

Se algo der errado em <5min após reload:

### 4.1 Sem mudança de schema

```bash
cd /var/www/lablare/lablare
git log --oneline -5                   # achar o commit anterior estável
git checkout <hash-anterior>
npm ci
npm run build
pm2 reload lablare
```

### 4.2 Com mudança de schema (migration aplicada)

⚠️ **Mais delicado.** Migrations não revertem automaticamente.

```bash
# 1. Voltar código
git checkout <hash-anterior>
npm ci
npm run build

# 2. Restaurar dump pré-deploy
gunzip < /var/backups/lablare/pre-deploy-$DATE.sql.gz \
  | mysql -u lablare_migrate -p lablare

# 3. Resolver no Prisma o estado das migrations
npx prisma migrate resolve --rolled-back <nome_da_migration_que_foi_revertida>

# 4. Reload
pm2 reload lablare
```

---

## 5. Backups

### 5.1 Política recomendada

| Tipo | Frequência | Retenção | Onde |
|------|-----------|----------|------|
| Dump full diário | 1×/dia (madrugada) | 30 dias | Storage externo (S3/B2) + local |
| Pré-deploy | A cada deploy | 90 dias | Local |
| Snapshot do disco | Semanal | 4 semanas | Hostinger snapshots |

**RPO:** 24h. **RTO:** 2h.

### 5.2 Script de backup diário

```bash
# /usr/local/bin/lablare-backup.sh
#!/bin/bash
set -euo pipefail

BACKUP_DIR=/var/backups/lablare
DATE=$(date +%F)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

mysqldump --single-transaction --routines --triggers lablare \
  | gzip > "$BACKUP_DIR/daily-$DATE.sql.gz"

# Replicar para S3/B2 (configurar awscli ou rclone antes)
# aws s3 cp "$BACKUP_DIR/daily-$DATE.sql.gz" s3://lablare-backups/daily/
# rclone copy "$BACKUP_DIR/daily-$DATE.sql.gz" b2:lablare-backups/daily/

# Limpar backups locais antigos
find "$BACKUP_DIR" -name 'daily-*.sql.gz' -mtime +$RETENTION_DAYS -delete
```

```bash
sudo chmod +x /usr/local/bin/lablare-backup.sh
sudo crontab -e
# Adicionar:
# 0 3 * * * /usr/local/bin/lablare-backup.sh >> /var/log/lablare-backup.log 2>&1
```

### 5.3 Teste de restore (mensal — não negociável)

Backup que nunca foi restaurado é teatro. Mensalmente, em ambiente isolado:

```bash
# Criar banco de teste
mysql -e "CREATE DATABASE lablare_restore_test;"
gunzip < /var/backups/lablare/daily-YYYY-MM-DD.sql.gz \
  | mysql lablare_restore_test
mysql -e "SELECT COUNT(*) FROM lablare_restore_test.Paciente;"
mysql -e "DROP DATABASE lablare_restore_test;"
```

Documentar resultado em planilha. Se restaurar falhar — investigar imediatamente.

---

## 6. Monitoramento e logs

### 6.1 Logs PM2

```bash
pm2 logs lablare              # tail em tempo real
pm2 logs lablare --lines 500  # histórico
pm2 flush                     # limpar (apenas em emergência)
```

Arquivos: `./logs/pm2-out.log` e `./logs/pm2-error.log`.

### 6.2 Logs MySQL

```bash
sudo tail -f /var/log/mysql/error.log
```

### 6.3 Logs Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 6.4 OperacaoLog (auditoria de aplicação)

Visível em `/dashboard/configuracoes/logs` (apenas Admin). Persiste em tabela `OperacaoLog`.

### 6.5 Sentry (P2.C — pendente)

Quando configurado, painel em `sentry.io/organizations/<org>/projects/lablare/`. **Configurar antes do go-live** — sem isso, erros silenciosos passam.

---

## 7. Cron jobs

### 7.1 Backup diário (ver §5.2)

### 7.2 Expiração de orçamentos (D4 — pendente)

Hoje, expiração é lazy: orçamentos pendentes são marcados como `Expirado` quando alguém lista. Se ninguém listar por dias, ficam pendentes em queries diretas.

**Solução pós-MVP:** criar endpoint `/api/cron/expire-orcamentos` autenticado por header `X-Cron-Secret` (cuja chave fica em `CRON_SECRET` no `.env`), e cadastrar cron HTTP no Hostinger:

```
# Diariamente às 02:00
curl -H "X-Cron-Secret: $CRON_SECRET" https://app.lablare.com.br/api/cron/expire-orcamentos
```

---

## 8. Troubleshooting operacional

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| App responde 502 (Nginx) | PM2 caiu ou está em loop de restart | `pm2 status` → `pm2 logs` → identificar erro → corrigir → `pm2 restart` |
| App lento progressivamente | Memory leak ou conexões MySQL acumulando | `pm2 monit` → ver RAM. Se >max_memory_restart, PM2 reinicia sozinho |
| Login retorna 401 sem motivo após deploy | `NEXTAUTH_SECRET` mudou — sessões existentes invalidadas | Esperado. Comunicar usuários a relogarem |
| `Muitas tentativas. Tente novamente em Xs` | Rate limit atingido (5 falhas/15min/IP) | Aguardar janela. Se for ataque: bloquear IP no Nginx |
| Disco cheio | Logs sem rotação ou backups acumulados | `du -sh /var/log/* /var/backups/*` → identificar e limpar |
| Migration trava deploy | Schema divergente do esperado | `npx prisma migrate status` → analisar. Se necessário: `prisma migrate resolve --applied <name>` ou `--rolled-back <name>` |
| Email de reset não chega | SMTP creds erradas ou bloqueio do provedor | Logs mostram erro. Validar com `swaks` ou similar |
| `POST /api/send` retorna 503 | `RESEND_API_KEY` ausente | Setar no `.env` ou aceitar (form de contato fica off) |
| Orçamentos pendentes não expiram | Cron de §7.2 não configurado | Configurar OU forçar via `GET /api/orcamentos` (lazy expiry) |

---

## 9. Smoke test pós-deploy

Manual, ~5 min. **Sempre fazer.** Idealmente: automatizar com Playwright na próxima sprint.

- [ ] `https://app.lablare.com.br/home` carrega (200) e mostra cards de exames reais (não mock)
- [ ] `/login` aceita credenciais de admin → redireciona para `/dashboard`
- [ ] Sidebar lista as opções esperadas para o perfil
- [ ] Criar paciente novo: aparece na lista após F5
- [ ] Criar orçamento para esse paciente: aparece em `/dashboard/orcamento`
- [ ] Converter orçamento → solicitação: aparece em `/dashboard/aprovar-solicitacoes`
- [ ] Aprovar: passa para `/dashboard/pedidos` em status AGUARDANDO_PAGAMENTO
- [ ] Registrar pagamento: passa para AGUARDANDO_COLETA, gera HTML de etiqueta
- [ ] Confirmar amostra em `/dashboard/recebimento-amostras`
- [ ] Em `/dashboard/lancamento-resultados`: lançar parâmetros (este foi o fluxo que estava quebrado pré-F3)
- [ ] Em `/dashboard/validacao-laudos`: validar laudo (Admin ou Biomédico)
- [ ] Solicitação aparece como FINALIZADO ou LAUDO_VALIDADO
- [ ] Logout
- [ ] Login do paciente em `/portal-paciente` (CPF + senha temporária)
- [ ] Forçado a `/primeiro-acesso` — trocar senha
- [ ] Vê laudo do exame na lista

Se algum passo falhar e o sistema já estiver em produção: **iniciar rollback (§4) imediatamente**.
