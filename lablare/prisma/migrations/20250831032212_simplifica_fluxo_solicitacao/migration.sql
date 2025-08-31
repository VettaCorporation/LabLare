/*
  Warnings:

  - You are about to drop the column `id_aprovador` on the `solicitacao` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `solicitacao` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(1))`.

*/
-- DropForeignKey
ALTER TABLE `solicitacao` DROP FOREIGN KEY `Solicitacao_id_aprovador_fkey`;

-- DropIndex
DROP INDEX `Solicitacao_id_aprovador_fkey` ON `solicitacao`;

-- AlterTable
ALTER TABLE `solicitacao` DROP COLUMN `id_aprovador`,
    MODIFY `status` ENUM('AGUARDANDO_COLETA', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'AGUARDANDO_COLETA';
