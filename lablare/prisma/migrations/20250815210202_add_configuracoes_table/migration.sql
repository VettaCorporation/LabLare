-- CreateTable
CREATE TABLE `Configuracao` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `nomeLaboratorio` VARCHAR(255) NULL,
    `endereco` TEXT NULL,
    `telefone` VARCHAR(50) NULL,
    `emailContato` VARCHAR(255) NULL,
    `logoUrl` TEXT NULL,
    `rodapeLaudo` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
