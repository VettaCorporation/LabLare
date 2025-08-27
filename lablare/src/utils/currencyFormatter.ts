// Caminho: src/utils/currencyFormatter.ts

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
