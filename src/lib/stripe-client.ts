import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export function getStripeClient(): Promise<Stripe | null> {
  if (stripePromise) return stripePromise

  // Fall back to env var if present (avoids network round-trip during migration)
  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (envKey) {
    stripePromise = loadStripe(envKey)
    return stripePromise
  }

  stripePromise = fetch('/api/stripe/publishable-key')
    .then((res) => res.json())
    .then((data: { publishableKey: string }) => {
      if (!data.publishableKey) return null
      return loadStripe(data.publishableKey)
    })
    .catch(() => null)

  return stripePromise
}
