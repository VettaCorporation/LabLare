-- AlterTable
ALTER TABLE `solicitacao` ADD COLUMN `desconto_percentual` DECIMAL(5, 2) NULL,
    ADD COLUMN `valor_final` DECIMAL(10, 2) NULL;
