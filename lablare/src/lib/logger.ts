// src/lib/logger.ts
//
// Logger estruturado interno (façade). Substitui console.* em código de
// servidor (rotas API, libs, middleware) por uma API uniforme com níveis,
// contexto e formato adequado a cada ambiente.
//
// Em produção: emite JSON em uma linha por entrada — pronto para ingestão
// por agregadores (Datadog, Loki, CloudWatch, logs do PM2 do Hostinger).
// Em desenvolvimento: emite formato legível para humanos.
//
// Substituível por pino/winston no futuro sem mudar quem consome — basta
// reescrever este arquivo mantendo a API exportada.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Categoria/módulo lógico que emitiu (ex: 'auth', 'pacientes'). */
  ctx?: string;
  /** ID do usuário associado (quando disponível). */
  userId?: number | string;
  /** Campos extras de contexto. */
  [key: string]: unknown;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const IS_PROD = process.env.NODE_ENV === 'production';
const ENV_LEVEL = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
const MIN_LEVEL: LogLevel =
  ENV_LEVEL && LEVEL_RANK[ENV_LEVEL] !== undefined
    ? ENV_LEVEL
    : (IS_PROD ? 'info' : 'debug');

function shouldEmit(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL];
}

function pickSink(level: LogLevel): (...args: unknown[]) => void {
  if (level === 'error') return console.error;
  if (level === 'warn') return console.warn;
  return console.log;
}

function serializeError(err: unknown): Record<string, unknown> | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      err: err.message,
      errName: err.name,
      // Stack só em dev — em prod evita poluir logs e vazar caminhos internos
      ...(IS_PROD ? {} : { stack: err.stack }),
    };
  }
  return { err: String(err) };
}

function emit(
  level: LogLevel,
  msg: string,
  errOrCtx?: unknown,
  maybeCtx?: LogContext,
): void {
  if (!shouldEmit(level)) return;

  // emit('error', msg, error, ctx) — overload com Error
  // emit(level, msg, ctx)          — overload sem Error
  const isError = errOrCtx instanceof Error || (errOrCtx && typeof errOrCtx === 'object' && 'message' in (errOrCtx as object) && 'name' in (errOrCtx as object));
  const context = (isError ? maybeCtx : (errOrCtx as LogContext | undefined)) ?? undefined;
  const errorObj = isError ? errOrCtx : undefined;

  const errorFields = serializeError(errorObj);

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(context ?? {}),
    ...(errorFields ?? {}),
  };

  const sink = pickSink(level);

  if (IS_PROD) {
    try {
      sink(JSON.stringify(entry));
    } catch {
      // Fallback se algum campo de contexto não for serializável
      sink(`${entry.ts} ${level.toUpperCase()} ${msg}`);
    }
  } else {
    const tag = entry.ctx ? `[${entry.ctx}]` : '';
    if (errorFields) {
      sink(`${entry.ts} ${level.toUpperCase()} ${tag} ${msg}`, errorObj);
    } else if (context) {
      sink(`${entry.ts} ${level.toUpperCase()} ${tag} ${msg}`, context);
    } else {
      sink(`${entry.ts} ${level.toUpperCase()} ${tag} ${msg}`);
    }
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit('warn', msg, ctx),
  /**
   * Loga erro. Aceita o Error como segundo argumento e contexto opcional como
   * terceiro. Também aceita apenas contexto se for chamado sem Error.
   */
  error: (msg: string, errOrCtx?: unknown, ctx?: LogContext) =>
    emit('error', msg, errOrCtx, ctx),
};
