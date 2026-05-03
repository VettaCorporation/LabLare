import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  currencyToNumber,
  formatCurrencyOnType,
} from '@/utils/currencyFormatter';

// Helper para acomodar variações entre runtimes Node (  ou espaço comum)
const normalize = (s: string) => s.replace(/\s/g, ' ');

describe('formatCurrency', () => {
  it('formata zero', () => {
    expect(normalize(formatCurrency(0))).toBe('R$ 0,00');
  });

  it('formata número inteiro', () => {
    expect(normalize(formatCurrency(150))).toBe('R$ 150,00');
  });

  it('formata número com centavos', () => {
    expect(normalize(formatCurrency(1234.56))).toBe('R$ 1.234,56');
  });

  it('formata número grande', () => {
    expect(normalize(formatCurrency(1000000))).toBe('R$ 1.000.000,00');
  });

  it('arredonda para 2 casas decimais', () => {
    expect(normalize(formatCurrency(10.999))).toBe('R$ 11,00');
    expect(normalize(formatCurrency(10.991))).toBe('R$ 10,99');
  });
});

describe('currencyToNumber', () => {
  it('converte string formatada de volta para número', () => {
    expect(currencyToNumber('R$ 150,00')).toBe(150);
    expect(currencyToNumber('R$ 1.234,56')).toBe(1234.56);
  });

  it('aceita string sem prefixo R$', () => {
    expect(currencyToNumber('150,00')).toBe(150);
  });

  it('lida com espaços e formatação extra', () => {
    expect(currencyToNumber('  R$ 150,00  ')).toBe(150);
  });
});

describe('formatCurrencyOnType', () => {
  it('retorna R$ 0,00 para string vazia', () => {
    expect(normalize(formatCurrencyOnType(''))).toBe('R$ 0,00');
  });

  it('formata progressivamente conforme digita', () => {
    expect(normalize(formatCurrencyOnType('1'))).toBe('R$ 0,01');
    expect(normalize(formatCurrencyOnType('12'))).toBe('R$ 0,12');
    expect(normalize(formatCurrencyOnType('123'))).toBe('R$ 1,23');
    expect(normalize(formatCurrencyOnType('1234'))).toBe('R$ 12,34');
    expect(normalize(formatCurrencyOnType('12345'))).toBe('R$ 123,45');
    expect(normalize(formatCurrencyOnType('123456'))).toBe('R$ 1.234,56');
  });

  it('ignora caracteres não-numéricos', () => {
    expect(normalize(formatCurrencyOnType('R$ 12,34'))).toBe('R$ 12,34');
    expect(normalize(formatCurrencyOnType('abc1234def'))).toBe('R$ 12,34');
  });
});
