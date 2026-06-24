-- ============================================================
--  LoungeERP — Seed de dados para Soho
--  Execute no Supabase SQL Editor após rodar o schema.sql
-- ============================================================

-- ── Camarotes ──────────────────────────────────────────────
INSERT INTO camarotes (nome, descricao, capacidade, preco_base, localizacao, andar, ativo) VALUES
  ('Gold 1',      'Camarote Gold — vista privilegiada do palco',         10,  3500.00, 'Setor Gold',    '1º Andar', TRUE),
  ('Gold 2',      'Camarote Gold — vista privilegiada do palco',         10,  3500.00, 'Setor Gold',    '1º Andar', TRUE),
  ('Dom Julio 1', 'Camarote premium Dom Julio — open bar incluso',        8,  5000.00, 'Setor Premium', 'Mezanino', TRUE),
  ('Dom Julio 2', 'Camarote premium Dom Julio — open bar incluso',        8,  5000.00, 'Setor Premium', 'Mezanino', TRUE),
  ('Lounge 3',    'Lounge VIP com mesa e serviço exclusivo',              6,  2000.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 4',    'Lounge VIP com mesa e serviço exclusivo',              6,  2000.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 5',    'Lounge VIP com mesa e serviço exclusivo',              6,  2000.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 6',    'Lounge VIP com mesa e serviço exclusivo',              6,  2000.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 7',    'Lounge VIP com mesa e serviço exclusivo',              6,  2000.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 8',    'Lounge VIP com mesa e serviço exclusivo',              6,  2000.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 9',    'Lounge VIP com mesa e serviço exclusivo',              6,  2200.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 10',   'Lounge VIP com mesa e serviço exclusivo',              6,  2200.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 11',   'Lounge VIP com mesa e serviço exclusivo',              6,  2200.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 12',   'Lounge VIP com mesa e serviço exclusivo',              6,  2200.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 13',   'Lounge VIP com mesa e serviço exclusivo',              6,  2200.00, 'Área Lounge',   'Térreo',   TRUE),
  ('Lounge 14',   'Lounge VIP com mesa e serviço exclusivo',              6,  2200.00, 'Área Lounge',   'Térreo',   TRUE)
ON CONFLICT (nome) DO NOTHING;

-- ── Eventos de exemplo (próximos sábados) ──────────────────
-- Ajuste as datas conforme a agenda real da Soho
INSERT INTO eventos (nome, descricao, data_inicio, data_fim, ativo) VALUES
  ('Soho · 21 Jun',  'Festa Soho — sábado',  '2025-06-21 22:00:00-03', '2025-06-22 05:00:00-03', TRUE),
  ('Soho · 28 Jun',  'Festa Soho — sábado',  '2025-06-28 22:00:00-03', '2025-06-29 05:00:00-03', TRUE),
  ('Soho · 5 Jul',   'Festa Soho — sábado',  '2025-07-05 22:00:00-03', '2025-07-06 05:00:00-03', TRUE),
  ('Soho · 12 Jul',  'Festa Soho — sábado',  '2025-07-12 22:00:00-03', '2025-07-13 05:00:00-03', TRUE),
  ('Soho · 19 Jul',  'Festa Soho — sábado',  '2025-07-19 22:00:00-03', '2025-07-20 05:00:00-03', TRUE)
ON CONFLICT DO NOTHING;

-- ── Checklist pós-seed ─────────────────────────────────────
-- 1. Crie um usuário no Supabase Auth (Authentication > Users > Invite)
-- 2. Após criado, execute:
--    UPDATE users SET role = 'admin' WHERE email = 'seu@email.com';
-- 3. Acesse /login com as credenciais criadas
