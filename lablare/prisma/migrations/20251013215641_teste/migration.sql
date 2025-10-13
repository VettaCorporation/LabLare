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
    `cpf_login` VARCHAR(11) NULL,
    `hash_senha` VARCHAR(255) NOT NULL,
    `id_perfil` INTEGER NOT NULL,
    `data_criacao` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `primeiro_login` BOOLEAN NOT NULL DEFAULT false,
    `reset_password_token` VARCHAR(255) NULL,
    `reset_password_expires` DATETIME(3) NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    UNIQUE INDEX `Usuario_cpf_login_key`(`cpf_login`),
    UNIQUE INDEX `Usuario_reset_password_token_key`(`reset_password_token`),
    INDEX `Usuario_id_perfil_fkey`(`id_perfil`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Paciente` (
    `id_paciente` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_completo` VARCHAR(255) NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `data_nascimento` DATE NOT NULL,
    `sexo` VARCHAR(20) NULL,
    `contato` VARCHAR(20) NULL,
    `data_cadastro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `email` VARCHAR(255) NULL,

    UNIQUE INDEX `Paciente_cpf_key`(`cpf`),
    UNIQUE INDEX `Paciente_email_key`(`email`),
    INDEX `Paciente_nome_completo_idx`(`nome_completo`),
    PRIMARY KEY (`id_paciente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExameCatalogo` (
    `id_exame_catalogo` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo_pardini` VARCHAR(191) NULL,
    `codigo_lare` VARCHAR(191) NULL,
    `nome_exame` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `origem` ENUM('PARDINI', 'LARE') NOT NULL DEFAULT 'LARE',

    UNIQUE INDEX `ExameCatalogo_codigo_pardini_key`(`codigo_pardini`),
    UNIQUE INDEX `ExameCatalogo_codigo_lare_key`(`codigo_lare`),
    PRIMARY KEY (`id_exame_catalogo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Solicitacao` (
    `id_solicitacao` INTEGER NOT NULL AUTO_INCREMENT,
    `data_hora_solicitacao` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `medico_solicitante` VARCHAR(255) NULL,
    `id_paciente` INTEGER NOT NULL,
    `id_recepcionista` INTEGER NOT NULL,
    `id_aprovador` INTEGER NULL,
    `status` ENUM('AGUARDANDO_APROVACAO', 'AGUARDANDO_COLETA', 'FINALIZAR_PAGAMENTO', 'AGUARDANDO_PAGAMENTO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'AGUARDANDO_APROVACAO',
    `motivo_recusa` TEXT NULL,
    `desconto_percentual` DECIMAL(5, 2) NULL,
    `valor_final` DECIMAL(10, 2) NULL,

    INDEX `Solicitacao_id_aprovador_fkey`(`id_aprovador`),
    INDEX `Solicitacao_id_paciente_fkey`(`id_paciente`),
    INDEX `Solicitacao_id_recepcionista_fkey`(`id_recepcionista`),
    PRIMARY KEY (`id_solicitacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemSolicitacao` (
    `id_item_solicitacao` INTEGER NOT NULL AUTO_INCREMENT,
    `status_item` VARCHAR(50) NOT NULL DEFAULT 'Aguardando Coleta',
    `id_solicitacao` INTEGER NOT NULL,
    `id_exame_catalogo` INTEGER NOT NULL,
    `preco_item` DECIMAL(10, 2) NOT NULL,

    INDEX `ItemSolicitacao_id_solicitacao_idx`(`id_solicitacao`),
    INDEX `ItemSolicitacao_id_exame_catalogo_fkey`(`id_exame_catalogo`),
    PRIMARY KEY (`id_item_solicitacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pagamento` (
    `id_pagamento` INTEGER NOT NULL AUTO_INCREMENT,
    `id_solicitacao` INTEGER NOT NULL,
    `tipo_atendimento` VARCHAR(50) NOT NULL,
    `forma_pagamento` VARCHAR(50) NULL,
    `valor_pago` DECIMAL(10, 2) NOT NULL,
    `data_pagamento` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `Pagamento_id_solicitacao_fkey`(`id_solicitacao`),
    PRIMARY KEY (`id_pagamento`)
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
    INDEX `Laudo_id_biomedico_validador_fkey`(`id_biomedico_validador`),
    INDEX `Laudo_id_tecnico_fkey`(`id_tecnico`),
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

    INDEX `ParametroResultado_id_laudo_fkey`(`id_laudo`),
    PRIMARY KEY (`id_parametro_resultado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

    INDEX `Orcamento_id_paciente_fkey`(`id_paciente`),
    INDEX `Orcamento_id_recepcionista_fkey`(`id_recepcionista`),
    PRIMARY KEY (`id_orcamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrcamentoItem` (
    `id_orcamento_item` INTEGER NOT NULL AUTO_INCREMENT,
    `id_orcamento` INTEGER NOT NULL,
    `id_exame_catalogo` INTEGER NOT NULL,
    `preco_exame` DECIMAL(10, 2) NOT NULL,

    INDEX `OrcamentoItem_id_exame_catalogo_fkey`(`id_exame_catalogo`),
    INDEX `OrcamentoItem_id_orcamento_fkey`(`id_orcamento`),
    PRIMARY KEY (`id_orcamento_item`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `Privilegio` (
    `id_privilegio` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `rota` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Privilegio_rota_key`(`rota`),
    PRIMARY KEY (`id_privilegio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PerfilToPrivilegio` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_PerfilToPrivilegio_AB_unique`(`A`, `B`),
    INDEX `_PerfilToPrivilegio_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_id_perfil_fkey` FOREIGN KEY (`id_perfil`) REFERENCES `Perfil`(`id_perfil`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Solicitacao` ADD CONSTRAINT `Solicitacao_id_aprovador_fkey` FOREIGN KEY (`id_aprovador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Solicitacao` ADD CONSTRAINT `Solicitacao_id_paciente_fkey` FOREIGN KEY (`id_paciente`) REFERENCES `Paciente`(`id_paciente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Solicitacao` ADD CONSTRAINT `Solicitacao_id_recepcionista_fkey` FOREIGN KEY (`id_recepcionista`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemSolicitacao` ADD CONSTRAINT `ItemSolicitacao_id_exame_catalogo_fkey` FOREIGN KEY (`id_exame_catalogo`) REFERENCES `ExameCatalogo`(`id_exame_catalogo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemSolicitacao` ADD CONSTRAINT `ItemSolicitacao_id_solicitacao_fkey` FOREIGN KEY (`id_solicitacao`) REFERENCES `Solicitacao`(`id_solicitacao`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pagamento` ADD CONSTRAINT `Pagamento_id_solicitacao_fkey` FOREIGN KEY (`id_solicitacao`) REFERENCES `Solicitacao`(`id_solicitacao`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Laudo` ADD CONSTRAINT `Laudo_id_biomedico_validador_fkey` FOREIGN KEY (`id_biomedico_validador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Laudo` ADD CONSTRAINT `Laudo_id_item_solicitacao_fkey` FOREIGN KEY (`id_item_solicitacao`) REFERENCES `ItemSolicitacao`(`id_item_solicitacao`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Laudo` ADD CONSTRAINT `Laudo_id_tecnico_fkey` FOREIGN KEY (`id_tecnico`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParametroResultado` ADD CONSTRAINT `ParametroResultado_id_laudo_fkey` FOREIGN KEY (`id_laudo`) REFERENCES `Laudo`(`id_laudo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orcamento` ADD CONSTRAINT `Orcamento_id_paciente_fkey` FOREIGN KEY (`id_paciente`) REFERENCES `Paciente`(`id_paciente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Orcamento` ADD CONSTRAINT `Orcamento_id_recepcionista_fkey` FOREIGN KEY (`id_recepcionista`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrcamentoItem` ADD CONSTRAINT `OrcamentoItem_id_exame_catalogo_fkey` FOREIGN KEY (`id_exame_catalogo`) REFERENCES `ExameCatalogo`(`id_exame_catalogo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrcamentoItem` ADD CONSTRAINT `OrcamentoItem_id_orcamento_fkey` FOREIGN KEY (`id_orcamento`) REFERENCES `Orcamento`(`id_orcamento`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PerfilToPrivilegio` ADD CONSTRAINT `_PerfilToPrivilegio_A_fkey` FOREIGN KEY (`A`) REFERENCES `Perfil`(`id_perfil`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PerfilToPrivilegio` ADD CONSTRAINT `_PerfilToPrivilegio_B_fkey` FOREIGN KEY (`B`) REFERENCES `Privilegio`(`id_privilegio`) ON DELETE CASCADE ON UPDATE CASCADE;
