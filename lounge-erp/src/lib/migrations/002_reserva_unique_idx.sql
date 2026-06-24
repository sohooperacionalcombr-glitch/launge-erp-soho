-- ============================================================
--  Migração 002 — Trava de duplicidade de reservas ativas
--  Execute no Supabase SQL Editor após a migração 001
-- ============================================================
--
--  Regra: não pode existir mais de uma reserva com status ativo
--  para o mesmo camarote + evento.
--
--  Status considerados ativos: pendente, confirmado, confirmada, reservado
--  Status que NÃO bloqueiam nova reserva: cancelado, livre
-- ============================================================

DROP INDEX IF EXISTS reservas_camarote_evento_ativo_idx;

CREATE UNIQUE INDEX reservas_camarote_evento_ativo_idx
  ON reservas (camarote_id, evento_id)
  WHERE status IN ('pendente', 'confirmado', 'confirmada', 'reservado');
