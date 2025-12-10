-- Confirm all existing unconfirmed users in auth.users
-- Run this in Supabase SQL Editor to fix login issues for already-created staff

UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
