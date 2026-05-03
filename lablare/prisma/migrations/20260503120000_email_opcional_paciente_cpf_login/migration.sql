-- Migration: email_opcional_paciente_cpf_login
--
-- Objetivo:
-- 1) Tornar Usuario.email opcional (pacientes podem não ter email cadastrado).
-- 2) Mover CPF que estava sendo gravado em Usuario.email para Usuario.cpf_login,
--    para pacientes legacy criados com o padrão antigo (email = cpf, cpf_login = NULL).
--    Pacientes que tinham email real associado (Paciente.email) recebem esse email
--    no Usuario.email; demais ficam com Usuario.email = NULL.
--
-- Pré-requisitos antes de aplicar em produção:
--   * Backup completo do banco.
--   * Rodar queries de inventário (descritas no plano P0.8) para confirmar
--     que nenhum colaborador tem email no formato de CPF e que não há colisões
--     entre Paciente.email e Usuario.email.

-- 1. Tornar Usuario.email opcional
ALTER TABLE `Usuario` MODIFY COLUMN `email` VARCHAR(255) NULL;

-- 2. Migrar pacientes legacy: mover CPF de email para cpf_login.
--    Filtros:
--      - Apenas Usuario com perfil 'Paciente'
--      - email no formato exato de 11 dígitos (CPF sem máscara)
--      - cpf_login ainda NULL (não tocar em registros já corrigidos)
--    LEFT JOIN com Paciente para preservar email real, se existir.
UPDATE Usuario u
JOIN Perfil p ON u.id_perfil = p.id_perfil
LEFT JOIN Paciente pac ON pac.cpf = u.email
SET u.cpf_login = u.email,
    u.email = pac.email
WHERE p.nome_perfil = 'Paciente'
  AND u.email REGEXP '^[0-9]{11}$'
  AND u.cpf_login IS NULL;
