/*
  Warnings:

  - You are about to drop the column `privilegios` on the `perfil` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `perfil` DROP COLUMN `privilegios`;

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
ALTER TABLE `_PerfilToPrivilegio` ADD CONSTRAINT `_PerfilToPrivilegio_A_fkey` FOREIGN KEY (`A`) REFERENCES `Perfil`(`id_perfil`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PerfilToPrivilegio` ADD CONSTRAINT `_PerfilToPrivilegio_B_fkey` FOREIGN KEY (`B`) REFERENCES `Privilegio`(`id_privilegio`) ON DELETE CASCADE ON UPDATE CASCADE;
