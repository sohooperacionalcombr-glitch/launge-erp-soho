-- ============================================================
--  Migração 004 — Confirmar e configurar admin Soho
--  Execute COMPLETO no Supabase SQL Editor (Dashboard > SQL Editor)
--
--  Este script:
--  1. Confirma o e-mail (bypass verificação)
--  2. Redefine a senha usando bcrypt (pgcrypto)
--  3. Cria/atualiza registro em public.users como admin
-- ============================================================

-- Habilitar pgcrypto se ainda não estiver (seguro de rodar múltiplas vezes)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PASSO 1: Redefinir senha + confirmar e-mail
UPDATE auth.users
SET
  encrypted_password  = crypt('Soho@123456', gen_salt('bf', 10)),
  email_confirmed_at  = NOW(),
  confirmation_token  = '',
  recovery_token      = '',
  updated_at          = NOW()
WHERE email = 'admin@sohooperacional.com.br';

-- PASSO 2: Criar/atualizar registro em public.users
INSERT INTO public.users (auth_id, email, nome, role, ativo)
SELECT id, email, 'Administrador', 'admin', true
FROM auth.users
WHERE email = 'admin@sohooperacional.com.br'
ON CONFLICT (email)
  DO UPDATE SET
    auth_id    = (SELECT id FROM auth.users WHERE email = 'admin@sohooperacional.com.br'),
    nome       = 'Administrador',
    role       = 'admin',
    ativo      = true,
    updated_at = NOW();

-- PASSO 3: Verificar — deve retornar linha com email_confirmed_at preenchido
SELECT
  au.id            AS auth_id,
  au.email,
  au.email_confirmed_at,
  au.created_at    AS criado_em,
  pu.nome,
  pu.role
FROM auth.users  au
LEFT JOIN public.users pu ON pu.email = au.email
WHERE au.email = 'admin@sohooperacional.com.br';
