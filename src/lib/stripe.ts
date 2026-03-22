import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function ensureStripeCustomer(userId: string): Promise<string> {
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

  await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}
