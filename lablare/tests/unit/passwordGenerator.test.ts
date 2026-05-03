import { describe, it, expect } from 'vitest';
import { generateTemporaryPassword } from '@/lib/passwordGenerator';

const ALLOWED_CHARS = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
// O alfabeto exclui apenas 0/O e 1/I (pares mais ambíguos). L é mantido —
// distinguível de 1 em fonte monospace (usada no modal de cadastro).
const FORBIDDEN_CHARS = /[OI01]/;

describe('generateTemporaryPassword', () => {
  it('gera 10 caracteres', () => {
    expect(generateTemporaryPassword()).toHaveLength(10);
  });

  it('usa apenas alfabeto sem caracteres ambíguos', () => {
    for (let i = 0; i < 100; i++) {
      const pwd = generateTemporaryPassword();
      expect(pwd).toMatch(ALLOWED_CHARS);
      expect(pwd).not.toMatch(FORBIDDEN_CHARS);
    }
  });

  it('produz valores diferentes em chamadas consecutivas', () => {
    const first = generateTemporaryPassword();
    const second = generateTemporaryPassword();
    expect(first).not.toBe(second);
  });

  it('cobre todo o alfabeto em uma amostra grande', () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.split('');
    const observed = new Set<string>();

    // 1000 senhas × 10 chars = 10.000 chars; chance de não cobrir 32 chars é negligenciável
    for (let i = 0; i < 1000; i++) {
      for (const ch of generateTemporaryPassword()) observed.add(ch);
    }

    for (const ch of alphabet) {
      expect(observed.has(ch)).toBe(true);
    }
  });
});
