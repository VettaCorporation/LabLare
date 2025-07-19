// src/utils/cpfFormatter.ts

export function formatCpfForDisplay(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  if (numericValue.length <= 3) { return numericValue; }
  if (numericValue.length <= 6) { return `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`; }
  if (numericValue.length <= 9) { return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6)}`; }
  return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6, 9)}-${numericValue.slice(9, 11)}`;
}