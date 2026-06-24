-- ============================================================
--  Migração 003 — Base para módulo de Portaria
--  Execute no Supabase SQL Editor após as migrações 001 e 002
-- ============================================================

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS checkin_realizado    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkin_horario      timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_responsavel  text;
