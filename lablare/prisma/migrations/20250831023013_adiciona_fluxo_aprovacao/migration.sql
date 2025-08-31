/*
  Warnings:

  - You are about to alter the column `status` on the `solicitacao` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `solicitacao` ADD COLUMN `id_aprovador` INTEGER NULL,
    MODIFY `status` ENUM('AGUARDANDO_APROVACAO', 'AGUARDANDO_COLETA', 'AGUARDANDO_PAGAMENTO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'AGUARDANDO_APROVACAO';

-- AddForeignKey
ALTER TABLE `Solicitacao` ADD CONSTRAINT `Solicitacao_id_aprovador_fkey` FOREIGN KEY (`id_aprovador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;
