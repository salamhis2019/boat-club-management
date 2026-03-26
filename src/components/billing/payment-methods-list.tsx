'use client'

import { useState } from 'react'
import { deletePaymentMethod, setDefaultPaymentMethod } from '@/app/actions/billing'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CreditCardIcon, Trash2Icon, StarIcon, LinkIcon } from 'lucide-react'

type PaymentMethod = {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
}

export function PaymentMethodsList({
  methods,
  defaultId,
}: {
  methods: PaymentMethod[]
  defaultId: string | null
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoading(deleteTarget.id)
    setDeleteTarget(null)
    await deletePaymentMethod(deleteTarget.id)
    window.location.reload()
  }

  const handleSetDefault = async (pmId: string) => {
    setLoading(pmId)
    await setDefaultPaymentMethod(pmId)
    window.location.reload()
  }

  return (
    <div className="space-y-3">
      {methods.map((pm) => {
        const isDefault = pm.id === defaultId
        const isLink = pm.brand === 'link'

        return (
          <div
            key={pm.id}
            className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
              isDefault
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-background hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex size-10 items-center justify-center rounded-lg ${
                isDefault ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {isLink ? (
                  <LinkIcon className="size-5" />
                ) : (
                  <CreditCardIcon className="size-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold capitalize">
                    {isLink ? 'Stripe Link' : pm.brand}
                  </p>
                  {!isLink && (
                    <span className="text-sm text-muted-foreground font-mono">
                      **** {pm.last4}
                    </span>
                  )}
                  {isDefault && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">Default</Badge>
                  )}
                </div>
                {!isLink && pm.exp_month > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Expires {String(pm.exp_month).padStart(2, '0')}/{pm.exp_year}
                  </p>
                )}
                {isLink && (
                  <p className="text-xs text-muted-foreground">
                    Pay with saved Link account
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSetDefault(pm.id)}
                  disabled={loading === pm.id}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <StarIcon className="mr-1.5 size-3.5" />
                  Set Default
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteTarget(pm)}
                disabled={loading === pm.id}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </div>
        )
      })}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              {deleteTarget?.brand === 'link'
                ? 'Stripe Link'
                : `${deleteTarget?.brand} **** ${deleteTarget?.last4}`}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
