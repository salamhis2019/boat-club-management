-- Add encrypted Stripe API key columns to existing club_settings table
alter table club_settings
  add column if not exists stripe_publishable_key text,
  add column if not exists stripe_secret_key_encrypted text,
  add column if not exists stripe_secret_key_iv text,
  add column if not exists stripe_secret_key_tag text,
  add column if not exists stripe_webhook_secret_encrypted text,
  add column if not exists stripe_webhook_secret_iv text,
  add column if not exists stripe_webhook_secret_tag text,
  add column if not exists updated_by uuid references auth.users(id);

-- Enable RLS (table is currently UNRESTRICTED)
alter table club_settings enable row level security;

-- No RLS policies — only the service role client (which bypasses RLS) can access
grant all on club_settings to service_role;
