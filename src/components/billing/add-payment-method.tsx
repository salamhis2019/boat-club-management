'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createSetupIntent } from '@/app/actions/billing'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PlusIcon } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function SetupForm({ onSuccess }: { onSuccess: () => void }) {
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
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? 'Saving...' : 'Save Payment Method'}
      </Button>
    </form>
  )
}

export function AddPaymentMethod() {
  const [open, setOpen] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !clientSecret) {
      const result = await createSetupIntent()
      if (result.error) {
        setError(result.error)
      } else {
        setClientSecret(result.clientSecret)
      }
    }
  }

  const handleSuccess = () => {
    setOpen(false)
    setClientSecret(null)
    window.location.reload()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="mr-1.5 size-4" />
          Add Card
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SetupForm onSuccess={handleSuccess} />
          </Elements>
        ) : !error ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
