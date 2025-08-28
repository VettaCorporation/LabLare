// Caminho: src/utils/currencyFormatter.ts

/**
 * Formata um valor numérico para a representação de moeda brasileira (R$).
 *
 * @param {number} value - O valor a ser formatado.
 * @returns {string} O valor formatado como moeda.
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Converte um valor formatado como string de moeda para um número.
 *
 * @param {string} value - A string de moeda a ser convertida.
 * @returns {number} O valor numérico.
 */
export function currencyToNumber(value: string): number {
  const cleanValue = value.replace('R$', '').replace('.', '').replace(',', '.').trim();
  return parseFloat(cleanValue);
}

/**
 * Formata um valor de input em tempo real para a representação de moeda brasileira (R$).
 * Esta função é útil para inputs de formulário.
 *
 * @param {string} value - O valor do input.
 * @returns {string} O valor formatado para o input.
 */
export function formatCurrencyOnType(value: string): string {
  // Remove todos os caracteres que não sejam dígitos
  const digits = value.replace(/\D/g, '');

  // Se a string estiver vazia, retorna R$ 0,00
  if (digits === '') {
    return 'R$ 0,00';
  }

  // Adiciona o zero inicial se o valor tiver apenas um dígito (ex: '1' -> '01')
  const paddedDigits = digits.padStart(3, '0');

  // Converte a string para um número para poder dividir por 100 e obter os centavos
  const num = parseInt(paddedDigits, 10);
  const real = num / 100;

  // Formata o número para moeda brasileira
  return real.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
