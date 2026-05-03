import { describe, it, expect } from 'vitest';
import { isValidCPF } from '@/utils/cpfValidator';

describe('isValidCPF', () => {
  it('rejeita valores nulos ou indefinidos', () => {
    expect(isValidCPF(null)).toBe(false);
    expect(isValidCPF(undefined)).toBe(false);
    expect(isValidCPF('')).toBe(false);
  });

  it('rejeita CPF com tamanho errado', () => {
    expect(isValidCPF('123')).toBe(false);
    expect(isValidCPF('123456789012')).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidCPF('11111111111')).toBe(false);
    expect(isValidCPF('00000000000')).toBe(false);
    expect(isValidCPF('99999999999')).toBe(false);
  });

  it('rejeita CPF com dígitos verificadores incorretos', () => {
    expect(isValidCPF('12345678900')).toBe(false);
    expect(isValidCPF('11144477700')).toBe(false);
  });

  it('aceita CPFs válidos (sem máscara)', () => {
    expect(isValidCPF('11144477735')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('aceita CPFs válidos (com máscara)', () => {
    expect(isValidCPF('111.444.777-35')).toBe(true);
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });

  it('ignora caracteres não-numéricos antes da validação', () => {
    expect(isValidCPF(' 1 1 1 . 4 4 4 . 7 7 7 - 3 5 ')).toBe(true);
  });
});
