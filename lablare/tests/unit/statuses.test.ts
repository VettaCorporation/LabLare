import { describe, it, expect } from 'vitest';
import {
  STATUS_ITEM,
  STATUS_LAUDO,
  STATUS_ORCAMENTO,
} from '@/lib/statuses';

describe('STATUS_ITEM', () => {
  it('mantém os valores exatos esperados pelo banco', () => {
    expect(STATUS_ITEM.AGUARDANDO_COLETA).toBe('Aguardando Coleta');
    expect(STATUS_ITEM.AMOSTRA_RECEBIDA).toBe('Amostra Recebida');
    expect(STATUS_ITEM.RECEBIDA_AREA_TECNICA).toBe('Recebida pela área técnica');
  });
});

describe('STATUS_LAUDO', () => {
  it('mantém os valores exatos esperados pelo banco', () => {
    expect(STATUS_LAUDO.AGUARDANDO_LANCAMENTO).toBe('Aguardando Lançamento');
    expect(STATUS_LAUDO.PENDENTE_VALIDACAO).toBe('Pendente de Validação');
    expect(STATUS_LAUDO.VALIDADO).toBe('Validado');
    expect(STATUS_LAUDO.REJEITADO).toBe('Rejeitado');
  });

  it('VALIDADO é Title Case (não UPPERCASE) — guard contra regressão do bug B11', () => {
    // Bug histórico: dashboard/stats usava 'VALIDADO' e o KPI sempre dava 0.
    // Este teste falha se alguém regredir.
    expect(STATUS_LAUDO.VALIDADO).toBe('Validado');
    expect(STATUS_LAUDO.VALIDADO).not.toBe('VALIDADO');
  });
});

describe('STATUS_ORCAMENTO', () => {
  it('mantém os valores exatos esperados pelo banco', () => {
    expect(STATUS_ORCAMENTO.PENDENTE).toBe('Pendente');
    expect(STATUS_ORCAMENTO.APROVADO).toBe('Aprovado');
    expect(STATUS_ORCAMENTO.EXPIRADO).toBe('Expirado');
  });
});
