/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Paciente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `paciente` ADD COLUMN `email` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Paciente_email_key` ON `Paciente`(`email`);
