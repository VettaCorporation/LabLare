-- CreateTable
CREATE TABLE `OperacaoLog` (
    `id_log` INTEGER NOT NULL AUTO_INCREMENT,
    `data_hora` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `acao` VARCHAR(255) NOT NULL,
    `detalhes` TEXT NULL,
    `id_usuario` INTEGER NULL,

    INDEX `OperacaoLog_data_hora_idx`(`data_hora` DESC),
    INDEX `OperacaoLog_id_usuario_idx`(`id_usuario`),
    INDEX `OperacaoLog_acao_idx`(`acao`),
    PRIMARY KEY (`id_log`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OperacaoLog` ADD CONSTRAINT `OperacaoLog_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;
