// Caminho: src/utils/cpfFormatter.ts

export const formatCpfForDisplay = (cpf: string = ''): string => {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCpfOnType = (cpf: string = ''): string => {
  if (!cpf) return '';
  const numericValue = cpf.replace(/\D/g, '');
  if (numericValue.length <= 3) return numericValue;
  if (numericValue.length <= 6) return `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`;
  if (numericValue.length <= 9) return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6)}`;
  return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6, 9)}-${numericValue.slice(9, 11)}`;
};