import { getStripe, getStripeKeys } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const stripe = await getStripe()
  const { webhookSecret } = await getStripeKeys()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object
      const chargeId = pi.metadata?.charge_id
      if (!chargeId) break

      // Idempotent: only update if not already paid
      await supabase
        .from('charges')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: pi.id,
        })
        .eq('id', chargeId)
        .neq('status', 'paid')

      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object
      const chargeId = pi.metadata?.charge_id
      if (!chargeId) break

      // Idempotent: only update if not already paid
      const { data: charge } = await supabase
        .from('charges')
        .select('retry_count, status')
        .eq('id', chargeId)
        .single()

      if (charge && charge.status !== 'paid') {
        await supabase
          .from('charges')
          .update({
            status: 'failed',
            stripe_payment_intent_id: pi.id,
            retry_count: (charge.retry_count ?? 0) + 1,
          })
          .eq('id', chargeId)
      }

      break
    }

    case 'setup_intent.succeeded': {
      const si = event.data.object
      const customerId = si.customer
      const pmId = si.payment_method

      if (customerId && pmId) {
        // If customer has no default PM, set this one as default
        const cid = typeof customerId === 'string' ? customerId : customerId.id
        const customer = await stripe.customers.retrieve(cid)
        if (!customer.deleted && !customer.invoice_settings?.default_payment_method) {
          await stripe.customers.update(customer.id, {
            invoice_settings: { default_payment_method: typeof pmId === 'string' ? pmId : pmId.id },
          })
        }
      }

      break
    }
  }

  return NextResponse.json({ received: true })
}
