-- ============================================================
--  Migração 001 — Campos financeiros da tabela reservas
--  Execute no Supabase SQL Editor
-- ============================================================

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS valor_recebido          numeric(10,2),
  ADD COLUMN IF NOT EXISTS responsavel_pagamento   text,
  ADD COLUMN IF NOT EXISTS forma_pagamento         text,
  ADD COLUMN IF NOT EXISTS status_financeiro       text,
  ADD COLUMN IF NOT EXISTS socio_responsavel       text,
  ADD COLUMN IF NOT EXISTS promoter_responsavel    text,
  ADD COLUMN IF NOT EXISTS cortesia_motivo         text,
  ADD COLUMN IF NOT EXISTS cortesia_aprovador      text,
  ADD COLUMN IF NOT EXISTS permuta_descricao       text,
  ADD COLUMN IF NOT EXISTS permuta_valor_estimado  numeric(10,2);

