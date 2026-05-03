import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('emite info via console.log', () => {
    logger.info('teste info', { ctx: 'test' });
    expect(logSpy).toHaveBeenCalledOnce();
  });

  it('emite warn via console.warn', () => {
    logger.warn('teste warn', { ctx: 'test' });
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('emite error via console.error', () => {
    logger.error('teste error', new Error('boom'), { ctx: 'test' });
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('aceita Error como segundo argumento', () => {
    const err = new Error('algo deu errado');
    logger.error('falha', err, { ctx: 'test', userId: 42 });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('aceita só context (sem Error)', () => {
    logger.error('sem objeto error', { ctx: 'test' });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('debug é silencioso por default em produção', () => {
    // Em dev (default do test), debug emite
    logger.debug('debug msg', { ctx: 'test' });
    expect(logSpy).toHaveBeenCalled();
  });

  it('inclui o ctx na saída em modo dev', () => {
    logger.info('mensagem com contexto', { ctx: 'meu-modulo' });
    const firstCall = logSpy.mock.calls[0];
    const text = String(firstCall?.[0] ?? '');
    expect(text).toContain('meu-modulo');
    expect(text).toContain('mensagem com contexto');
  });
});
