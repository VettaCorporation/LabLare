// src/utils/cpfValidator.ts

export function isValidCPF(cpf: string | null | undefined): boolean {
  if (!cpf) return false;

  // Remove caracteres não numéricos (pontos, traços, etc.)
  const cleanCpf = cpf.replace(/\D/g, '');

  // 1. Verifica se tem 11 dígitos
  if (cleanCpf.length !== 11) {
    return false;
  }

  // 2. Verifica se todos os dígitos são iguais (ex: 111.111.111-11), o que é inválido
  if (/^(\d)\1+$/.test(cleanCpf)) {
    return false;
  }

  // 3. Validação dos dígitos verificadores (algoritmo Módulo 11)
  let sum = 0;
  let remainder: number;

  // Calcula o primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCpf.substring(9, 10))) {
    return false;
  }

  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCpf.substring(10, 11))) {
    return false;
  }

  return true; // Se passou por todas as verificações, o CPF é válido
}