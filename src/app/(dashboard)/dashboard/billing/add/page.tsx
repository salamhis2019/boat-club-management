'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createSetupIntent } from '@/app/actions/billing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function SetupForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/billing?setup=success`,
      },
      redirect: 'if_required',
    })

    if (submitError) {
      setError(submitError.message ?? 'Something went wrong.')
      setLoading(false)
    } else {
      window.location.href = '/dashboard/billing?setup=success'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={!stripe || loading}>
          {loading ? 'Saving...' : 'Save Payment Method'}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/billing">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}

export default function AddPaymentMethodPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createSetupIntent().then((result) => {
      if (result.error) {
        setError(result.error)
      } else {
        setClientSecret(result.clientSecret)
      }
    })
  }, [])

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Add Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SetupForm />
            </Elements>
          ) : !error ? (
            <p className="text-sm text-muted-foreground">Loading payment form...</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
