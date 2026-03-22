'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createChargeSchema, retryChargeSchema } from '@/lib/validations/charges'
import { stripe, ensureStripeCustomer } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'

export type ChargeActionState = {
  error?: string
  success?: string
} | null

export async function createCharge(_prevState: ChargeActionState, formData: FormData): Promise<ChargeActionState> {
  const raw = {
    user_id: formData.get('user_id') as string,
    amount: formData.get('amount') as string,
    type: formData.get('type') as string,
    description: formData.get('description') as string,
    reservation_id: formData.get('reservation_id') as string | null,
  }

  const result = createChargeSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  // Verify current user is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const serviceClient = createServiceClient()

  // Check admin role
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Only admins can create charges.' }
  }

  // Generate invoice number: INV-YYYY-XXXX
  const year = new Date().getFullYear()
  const { count } = await serviceClient
    .from('charges')
    .select('*', { count: 'exact', head: true })

  const seq = String((count ?? 0) + 1).padStart(4, '0')
  const invoiceNumber = `INV-${year}-${seq}`

  // Ensure target user has a Stripe customer
  let customerId: string
  try {
    customerId = await ensureStripeCustomer(result.data.user_id)
  } catch {
    return { error: 'Failed to set up payment for this user.' }
  }

  // Insert charge record
  const chargeData = {
    user_id: result.data.user_id,
    amount: result.data.amount,
    type: result.data.type,
    description: result.data.description,
    reservation_id: result.data.reservation_id || null,
    invoice_number: invoiceNumber,
    status: 'pending' as const,
    retry_count: 0,
    created_by: user.id,
  }

  const { data: charge, error: insertError } = await serviceClient
    .from('charges')
    .insert(chargeData)
    .select('id')
    .single()

  if (insertError || !charge) {
    return { error: 'Failed to create charge. Please try again.' }
  }

  // Attempt auto-charge with saved payment method
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) {
      return { success: 'Charge created. Member has no saved payment method — they will see it on their billing page.' }
    }

    const defaultPm = customer.invoice_settings?.default_payment_method
    if (!defaultPm) {
      return { success: 'Charge created. Member has no saved payment method — they will see it on their billing page.' }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(result.data.amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method: typeof defaultPm === 'string' ? defaultPm : defaultPm.id,
      off_session: true,
      confirm: true,
      metadata: {
        charge_id: charge.id,
        user_id: result.data.user_id,
      },
    })

    // Update charge with payment intent ID
    await serviceClient
      .from('charges')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        paid_at: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null,
      })
      .eq('id', charge.id)

  } catch (err) {
    // Payment failed — update charge status
    const stripeErr = err as { type?: string; payment_intent?: { id: string } }
    if (stripeErr.type === 'StripeCardError' && stripeErr.payment_intent) {
      await serviceClient
        .from('charges')
        .update({
          stripe_payment_intent_id: stripeErr.payment_intent.id,
          status: 'failed',
          retry_count: 1,
        })
        .eq('id', charge.id)
    }
    // Charge stays pending if no payment intent was created
  }

  revalidatePath('/admin/charges')
  return { success: 'Charge created successfully.' }
}

export async function retryCharge(_prevState: ChargeActionState, formData: FormData): Promise<ChargeActionState> {
  const raw = { charge_id: formData.get('charge_id') as string }

  const result = retryChargeSchema.safeParse(raw)
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

  if (profile?.role !== 'admin') {
    return { error: 'Only admins can retry charges.' }
  }

  const { data: charge } = await serviceClient
    .from('charges')
    .select('*')
    .eq('id', result.data.charge_id)
    .single()

  if (!charge) {
    return { error: 'Charge not found.' }
  }

  if (charge.status === 'paid') {
    return { error: 'This charge has already been paid.' }
  }

  let customerId: string
  try {
    customerId = await ensureStripeCustomer(charge.user_id)
  } catch {
    return { error: 'Failed to set up payment for this user.' }
  }

  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) {
    return { error: 'Customer account has been deleted in Stripe.' }
  }

  const defaultPm = customer.invoice_settings?.default_payment_method
  if (!defaultPm) {
    return { error: 'Member has no saved payment method.' }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(charge.amount * 100),
      currency: 'usd',
      customer: customerId,
      payment_method: typeof defaultPm === 'string' ? defaultPm : defaultPm.id,
      off_session: true,
      confirm: true,
      metadata: {
        charge_id: charge.id,
        user_id: charge.user_id,
      },
    })

    await serviceClient
      .from('charges')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        paid_at: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null,
        retry_count: charge.retry_count + 1,
      })
      .eq('id', charge.id)

    revalidatePath('/admin/charges')
    return { success: 'Payment retry successful.' }
  } catch {
    await serviceClient
      .from('charges')
      .update({
        status: 'failed',
        retry_count: charge.retry_count + 1,
      })
      .eq('id', charge.id)

    revalidatePath('/admin/charges')
    return { error: 'Payment retry failed. The card was declined.' }
  }
}

export async function cancelCharge(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const serviceClient = createServiceClient()

  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return

  await serviceClient
    .from('charges')
    .delete()
    .eq('id', id)
    .eq('status', 'pending')

  revalidatePath('/admin/charges')
  revalidatePath('/dashboard/billing')
}

export async function payCharge(_prevState: ChargeActionState, formData: FormData): Promise<ChargeActionState> {
  const chargeId = formData.get('charge_id') as string
  if (!chargeId) {
    return { error: 'Missing charge ID.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const serviceClient = createServiceClient()

  const { data: charge } = await serviceClient
    .from('charges')
    .select('*')
    .eq('id', chargeId)
    .eq('user_id', user.id)
    .single()

  if (!charge) {
    return { error: 'Charge not found.' }
  }

  if (charge.status === 'paid') {
    return { error: 'This charge has already been paid.' }
  }

  let customerId: string
  try {
    customerId = await ensureStripeCustomer(user.id)
  } catch {
    return { error: 'Failed to set up payment.' }
  }

  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) {
    return { error: 'Payment account not found.' }
  }

  const defaultPm = customer.invoice_settings?.default_payment_method
  if (!defaultPm) {
    return { error: 'No payment method on file. Please add a card first.' }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(charge.amount * 100),
      currency: 'usd',
      customer: customerId,
      payment_method: typeof defaultPm === 'string' ? defaultPm : defaultPm.id,
      off_session: true,
      confirm: true,
      metadata: {
        charge_id: charge.id,
        user_id: user.id,
      },
    })

    await serviceClient
      .from('charges')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        paid_at: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null,
      })
      .eq('id', charge.id)

    revalidatePath('/dashboard/billing')
    revalidatePath('/admin/charges')
    return { success: 'Payment successful!' }
  } catch {
    await serviceClient
      .from('charges')
      .update({ status: 'failed', retry_count: charge.retry_count + 1 })
      .eq('id', charge.id)

    revalidatePath('/dashboard/billing')
    return { error: 'Payment failed. Your card was declined.' }
  }
}
