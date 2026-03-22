'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe, ensureStripeCustomer } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'

export async function createSetupIntent(): Promise<{ clientSecret: string | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { clientSecret: null, error: 'You must be logged in.' }
  }

  try {
    const customerId = await ensureStripeCustomer(user.id)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
    })
    return { clientSecret: setupIntent.client_secret }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('createSetupIntent error:', message)
    return { clientSecret: null, error: message }
  }
}

export async function getPaymentMethods() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    console.error('getPaymentMethods: no stripe_customer_id for user', user.id)
    return []
  }

  try {
    const [cardMethods, linkMethods] = await Promise.all([
      stripe.paymentMethods.list({ customer: profile.stripe_customer_id, type: 'card' }),
      stripe.paymentMethods.list({ customer: profile.stripe_customer_id, type: 'link' }),
    ])

    const allMethods = [...cardMethods.data, ...linkMethods.data]

    console.log('getPaymentMethods: found', allMethods.length, 'methods for customer', profile.stripe_customer_id)

    return allMethods.map((pm) => ({
      id: pm.id,
      brand: pm.type === 'link' ? 'link' : (pm.card?.brand ?? 'unknown'),
      last4: pm.card?.last4 ?? (pm.type === 'link' ? 'Link' : '****'),
      exp_month: pm.card?.exp_month ?? 0,
      exp_year: pm.card?.exp_year ?? 0,
    }))
  } catch (err) {
    console.error('getPaymentMethods error:', err instanceof Error ? err.message : err)
    return []
  }
}

export async function getDefaultPaymentMethodId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) return null

  try {
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    if (customer.deleted) return null
    const defaultPm = customer.invoice_settings?.default_payment_method
    if (!defaultPm) return null
    return typeof defaultPm === 'string' ? defaultPm : defaultPm.id
  } catch {
    return null
  }
}

export async function deletePaymentMethod(paymentMethodId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  try {
    await stripe.paymentMethods.detach(paymentMethodId)
    revalidatePath('/dashboard/billing')
    return {}
  } catch {
    return { error: 'Failed to remove payment method.' }
  }
}

export async function setDefaultPaymentMethod(paymentMethodId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return { error: 'No payment account found.' }
  }

  try {
    await stripe.customers.update(profile.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })
    revalidatePath('/dashboard/billing')
    return {}
  } catch {
    return { error: 'Failed to set default payment method.' }
  }
}
