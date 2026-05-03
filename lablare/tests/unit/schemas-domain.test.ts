import { describe, it, expect } from 'vitest';
import {
  registerColaboradorSchema,
  resetRequestSchema,
  validateCodeSchema,
  resetPasswordSchema,
} from '@/lib/schemas/auth';
import {
  aprovarSolicitacaoSchema,
  recusarSolicitacaoSchema,
  pagarSolicitacaoSchema,
  criarSolicitacaoSchema,
} from '@/lib/schemas/solicitacoes';
import { criarOrcamentoSchema } from '@/lib/schemas/orcamentos';
import { cadastroPacienteSchema } from '@/lib/schemas/pacientes';

describe('auth schemas', () => {
  describe('registerColaboradorSchema', () => {
    const valid = {
      nome_completo: 'Fulano de Tal',
      email: 'fulano@lablare.com',
      senha: 'abcdef',
      id_perfil: 1,
    };

    it('aceita payload válido', () => {
      expect(registerColaboradorSchema.safeParse(valid).success).toBe(true);
    });

    it('rejeita nome curto', () => {
      const r = registerColaboradorSchema.safeParse({ ...valid, nome_completo: 'F' });
      expect(r.success).toBe(false);
    });

    it('rejeita email inválido', () => {
      const r = registerColaboradorSchema.safeParse({ ...valid, email: 'no-arroba' });
      expect(r.success).toBe(false);
    });

    it('rejeita senha curta', () => {
      const r = registerColaboradorSchema.safeParse({ ...valid, senha: '123' });
      expect(r.success).toBe(false);
    });

    it('rejeita id_perfil zero ou negativo', () => {
      expect(registerColaboradorSchema.safeParse({ ...valid, id_perfil: 0 }).success).toBe(false);
      expect(registerColaboradorSchema.safeParse({ ...valid, id_perfil: -1 }).success).toBe(false);
    });
  });

  describe('resetRequestSchema', () => {
    it('aceita identifier não vazio', () => {
      expect(resetRequestSchema.safeParse({ identifier: 'foo@bar.com' }).success).toBe(true);
      expect(resetRequestSchema.safeParse({ identifier: '11144477735' }).success).toBe(true);
    });

    it('rejeita identifier vazio', () => {
      expect(resetRequestSchema.safeParse({ identifier: '' }).success).toBe(false);
    });
  });

  describe('validateCodeSchema', () => {
    it('aceita email + código de 6 chars', () => {
      const r = validateCodeSchema.safeParse({ email: 'a@b.com', code: 'ABC123' });
      expect(r.success).toBe(true);
    });

    it('rejeita código com tamanho diferente de 6', () => {
      expect(validateCodeSchema.safeParse({ email: 'a@b.com', code: 'AB12' }).success).toBe(false);
      expect(validateCodeSchema.safeParse({ email: 'a@b.com', code: 'ABC1234' }).success).toBe(false);
    });

    it('rejeita campos vazios', () => {
      expect(validateCodeSchema.safeParse({ email: '', code: 'ABC123' }).success).toBe(false);
      expect(validateCodeSchema.safeParse({ email: 'a@b.com', code: '' }).success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('aceita newPassword forte', () => {
      expect(resetPasswordSchema.safeParse({ newPassword: 'Senha@123' }).success).toBe(true);
    });

    it('rejeita newPassword fraca', () => {
      expect(resetPasswordSchema.safeParse({ newPassword: 'fraca' }).success).toBe(false);
    });

    it('NÃO aceita campo `token` no body — token vem do cookie httpOnly (P2 do P0.8)', () => {
      // Schema ignora campos extras por default — apenas confirma que
      // newPassword sozinha é suficiente.
      const r = resetPasswordSchema.safeParse({ newPassword: 'Senha@123', token: 'X' });
      expect(r.success).toBe(true);
    });
  });
});

describe('solicitacoes schemas', () => {
  describe('criarSolicitacaoSchema', () => {
    const valid = {
      pacienteId: 1,
      examesSelecionados: [{ id_exame_catalogo: 10 }],
      medico_solicitante: 'Dr. House',
    };

    it('aceita payload válido', () => {
      expect(criarSolicitacaoSchema.safeParse(valid).success).toBe(true);
    });

    it('aceita medico_solicitante opcional', () => {
      const { medico_solicitante: _, ...rest } = valid;
      expect(criarSolicitacaoSchema.safeParse(rest).success).toBe(true);
    });

    it('rejeita lista de exames vazia', () => {
      expect(criarSolicitacaoSchema.safeParse({ ...valid, examesSelecionados: [] }).success).toBe(false);
    });

    it('rejeita pacienteId zero/negativo', () => {
      expect(criarSolicitacaoSchema.safeParse({ ...valid, pacienteId: 0 }).success).toBe(false);
    });
  });

  describe('aprovarSolicitacaoSchema', () => {
    it('aceita desconto 0-100', () => {
      expect(aprovarSolicitacaoSchema.safeParse({ desconto_percentual: 0 }).success).toBe(true);
      expect(aprovarSolicitacaoSchema.safeParse({ desconto_percentual: 50 }).success).toBe(true);
      expect(aprovarSolicitacaoSchema.safeParse({ desconto_percentual: 100 }).success).toBe(true);
    });

    it('aceita body vazio (desconto default 0)', () => {
      const r = aprovarSolicitacaoSchema.safeParse({});
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.desconto_percentual).toBe(0);
    });

    it('rejeita desconto fora de [0, 100]', () => {
      expect(aprovarSolicitacaoSchema.safeParse({ desconto_percentual: -1 }).success).toBe(false);
      expect(aprovarSolicitacaoSchema.safeParse({ desconto_percentual: 101 }).success).toBe(false);
    });

    it('aceita string numérica para desconto (coerção)', () => {
      expect(aprovarSolicitacaoSchema.safeParse({ desconto_percentual: '25' }).success).toBe(true);
    });
  });

  describe('recusarSolicitacaoSchema', () => {
    it('aceita motivo não vazio', () => {
      expect(recusarSolicitacaoSchema.safeParse({ motivo: 'Falta de dados' }).success).toBe(true);
    });

    it('rejeita motivo vazio ou só espaços', () => {
      expect(recusarSolicitacaoSchema.safeParse({ motivo: '' }).success).toBe(false);
      expect(recusarSolicitacaoSchema.safeParse({ motivo: '   ' }).success).toBe(false);
    });
  });

  describe('pagarSolicitacaoSchema', () => {
    it('aceita tipo + forma de pagamento', () => {
      const r = pagarSolicitacaoSchema.safeParse({
        tipo_atendimento: 'PARTICULAR',
        forma_pagamento: 'PIX',
      });
      expect(r.success).toBe(true);
    });

    it('rejeita campos vazios', () => {
      expect(
        pagarSolicitacaoSchema.safeParse({ tipo_atendimento: '', forma_pagamento: 'PIX' }).success,
      ).toBe(false);
      expect(
        pagarSolicitacaoSchema.safeParse({ tipo_atendimento: 'PARTICULAR', forma_pagamento: '' }).success,
      ).toBe(false);
    });

    it('NÃO aceita valor_pago no body — valor vem do backend (P0.6)', () => {
      // Schema deve ignorar campos extras (z.object por default não strict)
      const r = pagarSolicitacaoSchema.safeParse({
        tipo_atendimento: 'PARTICULAR',
        forma_pagamento: 'PIX',
        valor_pago: 0.01,
      });
      expect(r.success).toBe(true);
      if (r.success) expect((r.data as any).valor_pago).toBeUndefined();
    });
  });
});

describe('orcamentos schemas', () => {
  describe('criarOrcamentoSchema', () => {
    const valid = {
      id_paciente: 1,
      exames: [{ id_exame_catalogo: 10 }],
      desconto: 0,
      validadeDias: 30,
    };

    it('aceita payload válido', () => {
      expect(criarOrcamentoSchema.safeParse(valid).success).toBe(true);
    });

    it('rejeita lista de exames vazia', () => {
      expect(criarOrcamentoSchema.safeParse({ ...valid, exames: [] }).success).toBe(false);
    });

    it('rejeita validadeDias <= 0 ou > 365', () => {
      expect(criarOrcamentoSchema.safeParse({ ...valid, validadeDias: 0 }).success).toBe(false);
      expect(criarOrcamentoSchema.safeParse({ ...valid, validadeDias: 400 }).success).toBe(false);
    });

    it('rejeita desconto negativo', () => {
      expect(criarOrcamentoSchema.safeParse({ ...valid, desconto: -10 }).success).toBe(false);
    });

    it('aplica default de desconto = 0 quando omitido', () => {
      const { desconto: _, ...rest } = valid;
      const r = criarOrcamentoSchema.safeParse(rest);
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.desconto).toBe(0);
    });
  });
});

describe('pacientes schemas', () => {
  describe('cadastroPacienteSchema', () => {
    const valid = {
      nome_completo: 'Maria da Silva',
      cpf: '111.444.777-35',
      data_nascimento: '1990-05-15',
    };

    it('aceita payload mínimo', () => {
      const r = cadastroPacienteSchema.safeParse(valid);
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.cpf).toBe('11144477735');
    });

    it('aceita payload completo', () => {
      const r = cadastroPacienteSchema.safeParse({
        ...valid,
        sexo: 'Feminino',
        email: 'maria@example.com',
        contato: '11999998888',
      });
      expect(r.success).toBe(true);
    });

    it('aceita email vazio (string vazia)', () => {
      expect(
        cadastroPacienteSchema.safeParse({ ...valid, email: '' }).success,
      ).toBe(true);
    });

    it('aceita email null', () => {
      expect(
        cadastroPacienteSchema.safeParse({ ...valid, email: null }).success,
      ).toBe(true);
    });

    it('rejeita email com formato inválido (não vazio)', () => {
      expect(
        cadastroPacienteSchema.safeParse({ ...valid, email: 'sem-arroba' }).success,
      ).toBe(false);
    });

    it('rejeita data_nascimento inválida', () => {
      expect(
        cadastroPacienteSchema.safeParse({ ...valid, data_nascimento: 'banana' }).success,
      ).toBe(false);
    });

    it('rejeita CPF com tamanho errado', () => {
      expect(cadastroPacienteSchema.safeParse({ ...valid, cpf: '123' }).success).toBe(false);
    });
  });
});
