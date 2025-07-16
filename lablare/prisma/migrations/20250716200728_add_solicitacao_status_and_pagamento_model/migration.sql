-- AlterTable
ALTER TABLE `Solicitacao` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO';

-- CreateTable
CREATE TABLE `Pagamento` (
    `id_pagamento` INTEGER NOT NULL AUTO_INCREMENT,
    `id_solicitacao` INTEGER NOT NULL,
    `tipo_atendimento` VARCHAR(50) NOT NULL,
    `forma_pagamento` VARCHAR(50) NULL,
    `valor_pago` DECIMAL(10, 2) NOT NULL,
    `data_pagamento` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_pagamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pagamento` ADD CONSTRAINT `Pagamento_id_solicitacao_fkey` FOREIGN KEY (`id_solicitacao`) REFERENCES `Solicitacao`(`id_solicitacao`) ON DELETE RESTRICT ON UPDATE CASCADE;
