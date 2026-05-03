// src/lib/rateLimit.ts
//
// Helper de rate limiting in-memory para deploys single-instance Node.js
// (Hostinger VPS / PM2 single mode).
//
// LIMITAÇÕES CONHECIDAS:
//  - Funciona apenas em single-instance. NÃO funciona em deploys serverless
//    (Vercel) ou multi-instance/cluster (PM2 -i max, Kubernetes): cada
//    processo terá seu próprio Map, atacante multiplica tentativas pelo
//    número de réplicas. Para esses ambientes, migrar para Redis/Upstash
//    ou persistência via Prisma (P1).
//  - Estado é perdido em restart do processo. Aceitável: janelas curtas
//    (5–60 min) e ataques retomam do zero, mas em troca não acumulamos
//    estado indefinidamente.
//
// Modelo: janela fixa por (key, clientId). Primeira request abre a janela
// com `windowMs` de duração; ao expirar, contador zera no próximo acesso.

import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

export interface RateLimitOptions {
  /** Identificador único do bucket (ex: 'login-admin', 'reset-request'). */
  key: string;
  /** Identificador do cliente — geralmente IP extraído via getClientIp. */
  clientId: string;
  /** Máximo de requests permitidas dentro da janela. */
  limit: number;
  /** Tamanho da janela em milissegundos. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Quantas requests ainda restam na janela atual. */
  remaining: number;
  /** Segundos até a janela resetar (0 quando allowed=true e não-último). */
  retryAfterSeconds: number;
}

const store = new Map<string, RateLimitEntry>();

function purgeIfExpired(storeKey: string, now: number): void {
  const entry = store.get(storeKey);
  if (entry && now >= entry.resetAt) {
    store.delete(storeKey);
  }
}

/**
 * Verifica e contabiliza uma tentativa contra o limite.
 *
 * @param options Configuração do bucket e do cliente.
 * @returns Decisão (allowed) + metadados para resposta HTTP.
 */
export function checkRateLimit({
  key,
  clientId,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const storeKey = `${key}:${clientId}`;
  const now = Date.now();

  purgeIfExpired(storeKey, now);

  const existing = store.get(storeKey);

  if (!existing) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Extrai o IP do cliente lidando com proxies (Hostinger usa Nginx).
 *
 * Ordem: x-forwarded-for (primeiro IP da lista) → x-real-ip → 'unknown'.
 *
 * @param request Objeto NextRequest, Request ou estrutura com .headers.
 * @returns IP do cliente ou 'unknown' se não detectável.
 */
export function getClientIp(
  request: NextRequest | Request | { headers: Headers | Record<string, string | string[] | undefined> },
): string {
  const headers = request.headers;

  const get = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    const raw = (headers as Record<string, string | string[] | undefined>)[name]
      ?? (headers as Record<string, string | string[] | undefined>)[name.toLowerCase()];
    if (Array.isArray(raw)) return raw[0] ?? null;
    return raw ?? null;
  };

  const xff = get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  const xRealIp = get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  return 'unknown';
}

/**
 * Inicia GC periódico que remove entries expiradas. Opcional — purgeIfExpired
 * já faz limpeza lazy. Útil apenas para evitar acúmulo se o app receber
 * tráfego muito esparso. Chamar uma única vez no startup, se desejado.
 */
let gcTimer: NodeJS.Timeout | null = null;
export function startRateLimitGc(): void {
  if (gcTimer) return;
  gcTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (now >= v.resetAt) store.delete(k);
    }
  }, 5 * 60 * 1000);
  gcTimer.unref?.();
}
