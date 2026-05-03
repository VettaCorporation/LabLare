import { describe, it, expect } from 'vitest';
import { formatCpfForDisplay, formatCpfOnType } from '@/utils/cpfFormatter';

describe('formatCpfForDisplay', () => {
  it('retorna string vazia para entrada vazia ou default', () => {
    expect(formatCpfForDisplay('')).toBe('');
    expect(formatCpfForDisplay()).toBe('');
  });

  it('formata CPF com 11 dígitos puros', () => {
    expect(formatCpfForDisplay('11144477735')).toBe('111.444.777-35');
  });

  it('mantém entrada inalterada quando não tem 11 dígitos limpos', () => {
    expect(formatCpfForDisplay('123')).toBe('123');
    expect(formatCpfForDisplay('123.456')).toBe('123.456');
    expect(formatCpfForDisplay('abc')).toBe('abc');
  });

  it('aceita CPF já mascarado e retorna no formato canônico', () => {
    expect(formatCpfForDisplay('111.444.777-35')).toBe('111.444.777-35');
  });

  it('ignora caracteres não-numéricos quando há 11 dígitos', () => {
    expect(formatCpfForDisplay('111-444-777-35')).toBe('111.444.777-35');
    expect(formatCpfForDisplay(' 1 1 1 4 4 4 7 7 7 3 5 ')).toBe('111.444.777-35');
  });
});

describe('formatCpfOnType', () => {
  it('retorna string vazia para entrada vazia', () => {
    expect(formatCpfOnType('')).toBe('');
  });

  it('aplica máscara incrementalmente conforme digita', () => {
    expect(formatCpfOnType('1')).toBe('1');
    expect(formatCpfOnType('111')).toBe('111');
    expect(formatCpfOnType('1114')).toBe('111.4');
    expect(formatCpfOnType('111444')).toBe('111.444');
    expect(formatCpfOnType('1114447')).toBe('111.444.7');
    expect(formatCpfOnType('111444777')).toBe('111.444.777');
    expect(formatCpfOnType('1114447773')).toBe('111.444.777-3');
    expect(formatCpfOnType('11144477735')).toBe('111.444.777-35');
  });

  it('descarta dígitos extras além de 11', () => {
    expect(formatCpfOnType('111444777359999')).toBe('111.444.777-35');
  });

  it('ignora caracteres não-numéricos', () => {
    expect(formatCpfOnType('111.444')).toBe('111.444');
    expect(formatCpfOnType('abc111def444')).toBe('111.444');
  });
});
