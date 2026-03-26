'use client'

import { useState } from 'react'
import { cancelCharge } from '@/app/actions/charges'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function CancelChargeButton({ chargeId }: { chargeId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    await cancelCharge(chargeId)
    setOpen(false)
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Cancel
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Charge</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this charge? This will permanently delete the pending charge and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep Charge
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading ? 'Cancelling...' : 'Cancel Charge'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
