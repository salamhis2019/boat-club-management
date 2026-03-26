import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { decrypt } from '@/lib/encryption'

export type StripeKeys = {
  secretKey: string
  publishableKey: string
  webhookSecret: string
}

// --- Cache with 5-minute TTL ---
let cachedStripe: Stripe | null = null
let cachedKeys: StripeKeys | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000

export function invalidateStripeCache(): void {
  cachedStripe = null
  cachedKeys = null
  cacheTimestamp = 0
}

export async function getStripeKeys(): Promise<StripeKeys> {
  if (cachedKeys && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedKeys
  }

  // Try DB first
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('club_settings')
    .select('*')
    .limit(1)
    .single()

  if (data?.stripe_secret_key_encrypted && data?.stripe_publishable_key) {
    const secretKey = decrypt(
      data.stripe_secret_key_encrypted,
      data.stripe_secret_key_iv,
      data.stripe_secret_key_tag
    )
    const webhookSecret = data.stripe_webhook_secret_encrypted
      ? decrypt(
          data.stripe_webhook_secret_encrypted,
          data.stripe_webhook_secret_iv,
          data.stripe_webhook_secret_tag
        )
      : process.env.STRIPE_WEBHOOK_SECRET ?? ''

    cachedKeys = {
      secretKey,
      publishableKey: data.stripe_publishable_key,
      webhookSecret,
    }
    cacheTimestamp = Date.now()
    return cachedKeys
  }

  // Fall back to env vars
  const secretKey = process.env.STRIPE_SECRET_KEY
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey) {
    throw new Error(
      'Stripe is not configured. Enter your API keys in Admin → Settings, or set STRIPE_SECRET_KEY.'
    )
  }

  cachedKeys = {
    secretKey,
    publishableKey: publishableKey ?? '',
    webhookSecret: webhookSecret ?? '',
  }
  cacheTimestamp = Date.now()
  return cachedKeys
}

export async function getStripe(): Promise<Stripe> {
  const keys = await getStripeKeys()

  // Re-use cached instance if keys haven't changed
  if (cachedStripe) {
    return cachedStripe
  }

  cachedStripe = new Stripe(keys.secretKey)
  return cachedStripe
}

export async function getPublishableKey(): Promise<string> {
  const keys = await getStripeKeys()
  return keys.publishableKey
}

export async function ensureStripeCustomer(userId: string): Promise<string> {
  const stripe = await getStripe()
  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!user) {
    throw new Error('User not found')
  }

  if (user.stripe_customer_id) {
    return user.stripe_customer_id
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.first_name} ${user.last_name}`,
    metadata: { supabase_user_id: user.id },
  })

  // Use conditional update to prevent race condition — only set if still null
  const { data: updated } = await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)
    .is('stripe_customer_id', null)
    .select('stripe_customer_id')
    .single()

  if (!updated) {
    // Another request already set it — use theirs and clean up ours
    const { data: existing } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    await stripe.customers.del(customer.id)
    return existing!.stripe_customer_id!
  }

  return customer.id
}
