-- CreateTable
CREATE TABLE `Notificacao` (
    `id_notificacao` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario_destino` INTEGER NOT NULL,
    `mensagem` TEXT NOT NULL,
    `rota_link` VARCHAR(255) NULL,
    `data_criacao` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `lida` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Notificacao_id_usuario_destino_idx`(`id_usuario_destino`),
    INDEX `Notificacao_lida_idx`(`lida`),
    PRIMARY KEY (`id_notificacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notificacao` ADD CONSTRAINT `Notificacao_id_usuario_destino_fkey` FOREIGN KEY (`id_usuario_destino`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
