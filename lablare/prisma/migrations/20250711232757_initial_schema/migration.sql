-- CreateTable
CREATE TABLE `Perfil` (
    `id_perfil` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_perfil` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `Perfil_nome_perfil_key`(`nome_perfil`),
    PRIMARY KEY (`id_perfil`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_completo` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `hash_senha` VARCHAR(255) NOT NULL,
    `id_perfil` INTEGER NOT NULL,
    `data_criacao` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Paciente` (
    `id_paciente` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_completo` VARCHAR(255) NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `data_nascimento` DATE NOT NULL,
    `sexo` VARCHAR(20) NULL,
    `data_cadastro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `Paciente_cpf_key`(`cpf`),
    INDEX `Paciente_nome_completo_idx`(`nome_completo`),
    PRIMARY KEY (`id_paciente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExameCatalogo` (
    `id_exame_catalogo` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_exame` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_exame_catalogo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Solicitacao` (
    `id_solicitacao` INTEGER NOT NULL AUTO_INCREMENT,
    `data_hora_solicitacao` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `medico_solicitante` VARCHAR(255) NULL,
    `id_paciente` INTEGER NOT NULL,
    `id_recepcionista` INTEGER NOT NULL,

    INDEX `Solicitacao_id_paciente_idx`(`id_paciente`),
    PRIMARY KEY (`id_solicitacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemSolicitacao` (
    `id_item_solicitacao` INTEGER NOT NULL AUTO_INCREMENT,
    `status_item` VARCHAR(50) NOT NULL DEFAULT 'Aguardando Coleta',
    `id_solicitacao` INTEGER NOT NULL,
    `id_exame_catalogo` INTEGER NOT NULL,

    INDEX `ItemSolicitacao_id_solicitacao_idx`(`id_solicitacao`),
    PRIMARY KEY (`id_item_solicitacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Laudo` (
    `id_laudo` INTEGER NOT NULL AUTO_INCREMENT,
    `data_lancamento` TIMESTAMP(0) NULL,
    `data_validacao` TIMESTAMP(0) NULL,
    `observacoes_tecnico` TEXT NULL,
    `observacoes_biomedico` TEXT NULL,
    `status_laudo` VARCHAR(50) NOT NULL DEFAULT 'Aguardando Lançamento',
    `id_item_solicitacao` INTEGER NOT NULL,
    `id_tecnico` INTEGER NULL,
    `id_biomedico_validador` INTEGER NULL,

    UNIQUE INDEX `Laudo_id_item_solicitacao_key`(`id_item_solicitacao`),
    INDEX `Laudo_status_laudo_idx`(`status_laudo`),
    PRIMARY KEY (`id_laudo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParametroResultado` (
    `id_parametro_resultado` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_parametro` VARCHAR(100) NOT NULL,
    `valor_resultado` VARCHAR(100) NOT NULL,
    `unidade_medida` VARCHAR(30) NULL,
    `valores_referencia` VARCHAR(255) NULL,
    `id_laudo` INTEGER NOT NULL,

    PRIMARY KEY (`id_parametro_resultado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_id_perfil_fkey` FOREIGN KEY (`id_perfil`) REFERENCES `Perfil`(`id_perfil`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Solicitacao` ADD CONSTRAINT `Solicitacao_id_paciente_fkey` FOREIGN KEY (`id_paciente`) REFERENCES `Paciente`(`id_paciente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Solicitacao` ADD CONSTRAINT `Solicitacao_id_recepcionista_fkey` FOREIGN KEY (`id_recepcionista`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemSolicitacao` ADD CONSTRAINT `ItemSolicitacao_id_solicitacao_fkey` FOREIGN KEY (`id_solicitacao`) REFERENCES `Solicitacao`(`id_solicitacao`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemSolicitacao` ADD CONSTRAINT `ItemSolicitacao_id_exame_catalogo_fkey` FOREIGN KEY (`id_exame_catalogo`) REFERENCES `ExameCatalogo`(`id_exame_catalogo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Laudo` ADD CONSTRAINT `Laudo_id_item_solicitacao_fkey` FOREIGN KEY (`id_item_solicitacao`) REFERENCES `ItemSolicitacao`(`id_item_solicitacao`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Laudo` ADD CONSTRAINT `Laudo_id_tecnico_fkey` FOREIGN KEY (`id_tecnico`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Laudo` ADD CONSTRAINT `Laudo_id_biomedico_validador_fkey` FOREIGN KEY (`id_biomedico_validador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParametroResultado` ADD CONSTRAINT `ParametroResultado_id_laudo_fkey` FOREIGN KEY (`id_laudo`) REFERENCES `Laudo`(`id_laudo`) ON DELETE RESTRICT ON UPDATE CASCADE;
