// ecosystem.config.js
//
// Configuração PM2 para o LabLare em Hostinger VPS (single-instance).
//
// Uso típico:
//   pm2 start ecosystem.config.js --env production
//   pm2 reload lablare           # zero-downtime reload
//   pm2 restart lablare          # restart com pequeno downtime
//   pm2 logs lablare             # acompanhar logs
//   pm2 save                     # persistir estado para reboot
//
// IMPORTANTE: NÃO usar instances > 1 enquanto o rate limit for in-memory
// (src/lib/rateLimit.ts). Cluster quebra a contagem de tentativas. Para
// escalar, primeiro migrar rate limit para Redis.

module.exports = {
  apps: [
    {
      name: 'lablare',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,

      // Single-instance intencional. Ver decisão D5 em docs/HANDOFF.md.
      instances: 1,
      exec_mode: 'fork',

      // Logs
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,

      // Reinício em caso de crash, com backoff
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 4000,

      // Reinicia se ultrapassar este limite de RAM (proteção contra leak).
      // Ajustar conforme RAM do VPS — 512M é conservador para Hostinger
      // entry-level. Aumentar se app crescer.
      max_memory_restart: '512M',

      // Variáveis de ambiente são lidas pelo PM2 do `.env` na raiz pelo
      // próprio Next 15 — não duplicamos aqui para evitar drift.
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Para rodar em homologação:  pm2 start ecosystem.config.js --env staging
      env_staging: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
