/*
  Warnings:

  - A unique constraint covering the columns `[codigo_pardini]` on the table `ExameCatalogo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `examecatalogo` ADD COLUMN `codigo_pardini` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ExameCatalogo_codigo_pardini_key` ON `ExameCatalogo`(`codigo_pardini`);
