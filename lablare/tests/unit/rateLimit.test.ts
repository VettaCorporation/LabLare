import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite requests dentro do limite', () => {
    const opts = { key: 'test-allow', clientId: 'ip-1', limit: 3, windowMs: 60_000 };
    expect(checkRateLimit(opts).allowed).toBe(true);
    expect(checkRateLimit(opts).allowed).toBe(true);
    expect(checkRateLimit(opts).allowed).toBe(true);
  });

  it('bloqueia request que excede o limite', () => {
    const opts = { key: 'test-block', clientId: 'ip-2', limit: 2, windowMs: 60_000 };
    expect(checkRateLimit(opts).allowed).toBe(true);
    expect(checkRateLimit(opts).allowed).toBe(true);
    const blocked = checkRateLimit(opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('decrementa "remaining" a cada request permitida', () => {
    const opts = { key: 'test-remaining', clientId: 'ip-3', limit: 5, windowMs: 60_000 };
    expect(checkRateLimit(opts).remaining).toBe(4);
    expect(checkRateLimit(opts).remaining).toBe(3);
    expect(checkRateLimit(opts).remaining).toBe(2);
  });

  it('libera novamente após a janela expirar', () => {
    const opts = { key: 'test-window', clientId: 'ip-4', limit: 1, windowMs: 60_000 };
    expect(checkRateLimit(opts).allowed).toBe(true);
    expect(checkRateLimit(opts).allowed).toBe(false);

    // avança o relógio para depois do fim da janela
    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit(opts).allowed).toBe(true);
  });

  it('isola buckets diferentes por (key, clientId)', () => {
    const opts1 = { key: 'k1', clientId: 'ip-x', limit: 1, windowMs: 60_000 };
    const opts2 = { key: 'k2', clientId: 'ip-x', limit: 1, windowMs: 60_000 };
    const opts3 = { key: 'k1', clientId: 'ip-y', limit: 1, windowMs: 60_000 };

    expect(checkRateLimit(opts1).allowed).toBe(true);
    expect(checkRateLimit(opts1).allowed).toBe(false); // mesmo bucket esgotado
    expect(checkRateLimit(opts2).allowed).toBe(true);  // outro key
    expect(checkRateLimit(opts3).allowed).toBe(true);  // outro clientId
  });
});

describe('getClientIp', () => {
  it('extrai o primeiro IP de x-forwarded-for', () => {
    const req = { headers: new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }) };
    expect(getClientIp(req as any)).toBe('203.0.113.7');
  });

  it('faz trim do IP', () => {
    const req = { headers: new Headers({ 'x-forwarded-for': '   203.0.113.8   ' }) };
    expect(getClientIp(req as any)).toBe('203.0.113.8');
  });

  it('cai para x-real-ip se não houver x-forwarded-for', () => {
    const req = { headers: new Headers({ 'x-real-ip': '198.51.100.5' }) };
    expect(getClientIp(req as any)).toBe('198.51.100.5');
  });

  it('retorna "unknown" sem cabeçalhos de proxy', () => {
    const req = { headers: new Headers({}) };
    expect(getClientIp(req as any)).toBe('unknown');
  });

  it('aceita objeto plain como headers (NextAuth)', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.99' } };
    expect(getClientIp(req as any)).toBe('203.0.113.99');
  });
});
