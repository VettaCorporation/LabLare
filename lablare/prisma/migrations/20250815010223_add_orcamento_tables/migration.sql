-- CreateTable
CREATE TABLE `Orcamento` (
    `id_orcamento` INTEGER NOT NULL AUTO_INCREMENT,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_validade` DATETIME(3) NOT NULL,
    `valor_bruto` DECIMAL(10, 2) NOT NULL,
    `desconto` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `valor_final` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    `id_paciente` INTEGER NOT NULL,
    `id_recepcionista` INTEGER NOT NULL,

    PRIMARY KEY (`id_orcamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrcamentoItem` (
    `id_orcamento_item` INTEGER NOT NULL AUTO_INCREMENT,
    `id_orcamento` INTEGER NOT NULL,
    `id_exame_catalogo` INTEGER NOT NULL,
    `preco_exame` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_orcamento_item`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Orcamento` ADD CONSTRAINT `Orcamento_id_paciente_fkey` FOREIGN KEY (`id_paciente`) REFERENCES `Paciente`(`id_paciente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orcamento` ADD CONSTRAINT `Orcamento_id_recepcionista_fkey` FOREIGN KEY (`id_recepcionista`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrcamentoItem` ADD CONSTRAINT `OrcamentoItem_id_orcamento_fkey` FOREIGN KEY (`id_orcamento`) REFERENCES `Orcamento`(`id_orcamento`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrcamentoItem` ADD CONSTRAINT `OrcamentoItem_id_exame_catalogo_fkey` FOREIGN KEY (`id_exame_catalogo`) REFERENCES `ExameCatalogo`(`id_exame_catalogo`) ON DELETE RESTRICT ON UPDATE CASCADE;
