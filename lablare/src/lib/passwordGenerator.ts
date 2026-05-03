// src/lib/passwordGenerator.ts
//
// Gerador cripto-seguro de senhas temporárias para pacientes recém-cadastrados.
// Alfabeto sem caracteres ambíguos (0/O e 1/I) para reduzir erros de
// transcrição manual: recepcionista anota → paciente digita.

import { randomBytes } from 'crypto';

const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars
const TEMP_PASSWORD_LENGTH = 10;

/**
 * Gera senha temporária com 10 caracteres em [A-Z2-9] excluindo {O, I, 1, 0}.
 * (L é mantido no alfabeto — distinguível em fonte monospace.)
 *
 * Entropia: 32^10 ≈ 1.12e15 (~50 bits) — suficiente como senha temporária
 * com rate limit ativo no login.
 *
 * Aplica rejection sampling para garantir distribuição uniforme sobre os
 * 32 caracteres do alfabeto (bytes maiores ou iguais a `maxValid` são
 * descartados).
 *
 * @returns Senha de 10 caracteres maiúsculos / dígitos sem ambíguos.
 */
export function generateTemporaryPassword(): string {
  const charsLen = TEMP_PASSWORD_ALPHABET.length;
  const maxValid = 256 - (256 % charsLen);

  let result = '';
  while (result.length < TEMP_PASSWORD_LENGTH) {
    const buf = randomBytes(TEMP_PASSWORD_LENGTH - result.length);
    for (const b of buf) {
      if (b < maxValid) {
        result += TEMP_PASSWORD_ALPHABET[b % charsLen];
        if (result.length >= TEMP_PASSWORD_LENGTH) break;
      }
    }
  }
  return result;
}
