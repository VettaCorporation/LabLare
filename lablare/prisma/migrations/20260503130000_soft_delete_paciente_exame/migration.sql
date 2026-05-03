-- Migration: soft_delete_paciente_exame
--
-- Adiciona coluna `ativo` (default true) em Paciente e ExameCatalogo para
-- suportar soft-delete. Registros existentes ficam ativos por padrão.
-- Cria índice em `ativo` para acelerar listagens filtradas.

ALTER TABLE `Paciente` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX `Paciente_ativo_idx` ON `Paciente`(`ativo`);

ALTER TABLE `ExameCatalogo` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX `ExameCatalogo_ativo_idx` ON `ExameCatalogo`(`ativo`);
