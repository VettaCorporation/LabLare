-- Migration: indices_queries_quentes
--
-- Adiciona índices em colunas usadas frequentemente em filtros (where) e
-- ordenações (orderBy) das rotas de API. Reduz full table scans em:
--
--   * Listagens de Solicitação (por status, ordenação por data)
--   * Recebimento/lançamento de amostras (filtro por status_item)
--   * Dashboard de stats (data_pagamento, data_cadastro, data_validacao)
--   * Stats e expiração de orçamentos (status, data_validade, data_criacao)
--
-- Tabelas pequenas (centenas/milhares de linhas) — ALTER TABLE ADD INDEX
-- é rápido e usa ALGORITHM=INPLACE no MySQL 8 (não bloqueia escritas).

CREATE INDEX `Paciente_data_cadastro_idx` ON `Paciente`(`data_cadastro`);

CREATE INDEX `Solicitacao_status_idx` ON `Solicitacao`(`status`);
CREATE INDEX `Solicitacao_data_hora_solicitacao_idx` ON `Solicitacao`(`data_hora_solicitacao`);

CREATE INDEX `ItemSolicitacao_status_item_idx` ON `ItemSolicitacao`(`status_item`);

CREATE INDEX `Pagamento_data_pagamento_idx` ON `Pagamento`(`data_pagamento`);

CREATE INDEX `Laudo_data_validacao_idx` ON `Laudo`(`data_validacao`);

CREATE INDEX `Orcamento_status_idx` ON `Orcamento`(`status`);
CREATE INDEX `Orcamento_data_validade_idx` ON `Orcamento`(`data_validade`);
CREATE INDEX `Orcamento_data_criacao_idx` ON `Orcamento`(`data_criacao`);
