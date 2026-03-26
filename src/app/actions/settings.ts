'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROLES } from '@/lib/constants/roles.const'
import { stripeKeysSchema } from '@/lib/validations/settings'
import { encrypt } from '@/lib/encryption'
import { invalidateStripeCache } from '@/lib/stripe'

export type SettingsActionState = {
  error?: string
  success?: string
} | null

export async function saveStripeKeys(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const raw = {
    publishable_key: formData.get('publishable_key') as string,
    secret_key: formData.get('secret_key') as string,
    webhook_secret: formData.get('webhook_secret') as string,
  }

  const result = stripeKeysSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const serviceClient = createServiceClient()

  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== ROLES.ADMIN) {
    return { error: 'Only admins can update settings.' }
  }

  // Test the secret key by calling Stripe
  try {
    const testStripe = new Stripe(result.data.secret_key)
    await testStripe.accounts.retrieve()
  } catch {
    return { error: 'Invalid secret key. Could not connect to Stripe.' }
  }

  // Encrypt secrets
  const encryptedSecret = encrypt(result.data.secret_key)
  const encryptedWebhook = result.data.webhook_secret
    ? encrypt(result.data.webhook_secret)
    : null

  // Update the singleton row in club_settings
  // First, get the existing row's ID
  const { data: existing } = await serviceClient
    .from('club_settings')
    .select('id')
    .limit(1)
    .single()

  if (!existing) {
    return { error: 'Club settings not found. Please contact support.' }
  }

  const { error: updateError } = await serviceClient
    .from('club_settings')
    .update({
      stripe_publishable_key: result.data.publishable_key,
      stripe_secret_key_encrypted: encryptedSecret.ciphertext,
      stripe_secret_key_iv: encryptedSecret.iv,
      stripe_secret_key_tag: encryptedSecret.tag,
      stripe_webhook_secret_encrypted: encryptedWebhook?.ciphertext ?? null,
      stripe_webhook_secret_iv: encryptedWebhook?.iv ?? null,
      stripe_webhook_secret_tag: encryptedWebhook?.tag ?? null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', existing.id)

  if (updateError) {
    console.error('Failed to save club settings:', updateError)
    return { error: 'Failed to save settings. Please try again.' }
  }

  invalidateStripeCache()
  return { success: 'Stripe keys saved successfully.' }
}

export type KeyStatus = {
  publishableKey: string | null
  secretKey: string | null
  webhookSecret: string | null
  source: 'database' | 'env' | 'none'
}

export async function getStripeKeyStatus(): Promise<KeyStatus> {
  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { publishableKey: null, secretKey: null, webhookSecret: null, source: 'none' }
  }

  const serviceClient = createServiceClient()

  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== ROLES.ADMIN) {
    return { publishableKey: null, secretKey: null, webhookSecret: null, source: 'none' }
  }

  // Check DB first
  const { data } = await serviceClient
    .from('club_settings')
    .select('stripe_publishable_key, stripe_secret_key_encrypted, stripe_webhook_secret_encrypted')
    .limit(1)
    .single()

  if (data?.stripe_secret_key_encrypted) {
    return {
      publishableKey: data.stripe_publishable_key
        ? `${data.stripe_publishable_key.slice(0, 7)}...${data.stripe_publishable_key.slice(-4)}`
        : null,
      secretKey: `sk_...${data.stripe_secret_key_encrypted.slice(-4)}`,
      webhookSecret: data.stripe_webhook_secret_encrypted ? 'whsec_...configured' : null,
      source: 'database',
    }
  }

  // Check env vars
  const envSecret = process.env.STRIPE_SECRET_KEY
  const envPublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const envWebhook = process.env.STRIPE_WEBHOOK_SECRET

  if (envSecret) {
    return {
      publishableKey: envPublishable ? `${envPublishable.slice(0, 7)}...${envPublishable.slice(-4)}` : null,
      secretKey: `sk_...${envSecret.slice(-4)}`,
      webhookSecret: envWebhook ? 'whsec_...configured' : null,
      source: 'env',
    }
  }

  return { publishableKey: null, secretKey: null, webhookSecret: null, source: 'none' }
}
