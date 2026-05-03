// src/lib/statuses.ts
//
// Constantes de status usadas em campos `String` do schema Prisma.
//
// Estes valores ainda vivem no DB como `String` (coluna VARCHAR), mas o
// código deve referenciar SEMPRE as constantes daqui para evitar typos
// (ex: 'Validado' vs 'VALIDADO' — bug histórico que zerava o KPI de
// turnaround do dashboard).
//
// Migração futura para enums Prisma é bem-vinda (P2): bastaria trocar o
// schema, gerar migração com mapeamento dos valores, e os imports daqui
// seguem funcionando.

/** Status do item de solicitação (`ItemSolicitacao.status_item`). */
export const STATUS_ITEM = {
  AGUARDANDO_COLETA: 'Aguardando Coleta',
  AMOSTRA_RECEBIDA: 'Amostra Recebida',
  RECEBIDA_AREA_TECNICA: 'Recebida pela área técnica',
} as const;

export type StatusItem = (typeof STATUS_ITEM)[keyof typeof STATUS_ITEM];

/** Status do laudo (`Laudo.status_laudo`). */
export const STATUS_LAUDO = {
  AGUARDANDO_LANCAMENTO: 'Aguardando Lançamento',
  PENDENTE_VALIDACAO: 'Pendente de Validação',
  VALIDADO: 'Validado',
  REJEITADO: 'Rejeitado',
} as const;

export type StatusLaudo = (typeof STATUS_LAUDO)[keyof typeof STATUS_LAUDO];

/** Status do orçamento (`Orcamento.status`). */
export const STATUS_ORCAMENTO = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  EXPIRADO: 'Expirado',
} as const;

export type StatusOrcamento =
  (typeof STATUS_ORCAMENTO)[keyof typeof STATUS_ORCAMENTO];
