'use client'

import { useActionState } from 'react'
import { payCharge, type ChargeActionState } from '@/app/actions/charges'
import { Button } from '@/components/ui/button'

export function PayChargeButton({ chargeId }: { chargeId: string }) {
  const [state, formAction, pending] = useActionState<ChargeActionState, FormData>(payCharge, null)

  return (
    <form action={formAction}>
      <input type="hidden" name="charge_id" value={chargeId} />
      {state?.error && (
        <p className="mb-1 text-xs text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="mb-1 text-xs text-green-600">{state.success}</p>
      )}
      <Button size="sm" disabled={pending}>
        {pending ? 'Paying...' : 'Pay Now'}
      </Button>
    </form>
  )
}
