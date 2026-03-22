'use client'

import { useActionState } from 'react'
import { retryCharge, type ChargeActionState } from '@/app/actions/charges'
import { Button } from '@/components/ui/button'

export function RetryChargeButton({ chargeId }: { chargeId: string }) {
  const [state, formAction, pending] = useActionState<ChargeActionState, FormData>(retryCharge, null)

  return (
    <form action={formAction}>
      <input type="hidden" name="charge_id" value={chargeId} />
      {state?.error && (
        <p className="mb-1 text-xs text-destructive">{state.error}</p>
      )}
      <Button variant="outline" size="sm" disabled={pending}>
        {pending ? 'Retrying...' : 'Retry'}
      </Button>
    </form>
  )
}
