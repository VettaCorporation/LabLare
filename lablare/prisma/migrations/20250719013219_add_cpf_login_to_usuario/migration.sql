/*
  Warnings:

  - A unique constraint covering the columns `[cpf_login]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reset_password_token]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `cpf_login` VARCHAR(11) NULL,
    ADD COLUMN `reset_password_expires` DATETIME(3) NULL,
    ADD COLUMN `reset_password_token` VARCHAR(255) NULL,
    MODIFY `email` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_cpf_login_key` ON `Usuario`(`cpf_login`);

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_reset_password_token_key` ON `Usuario`(`reset_password_token`);
