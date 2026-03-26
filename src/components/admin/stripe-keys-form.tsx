'use client'

import { useActionState } from 'react'
import { saveStripeKeys, type SettingsActionState, type KeyStatus } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function StripeKeysForm({ keyStatus }: { keyStatus: KeyStatus }) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    saveStripeKeys,
    null
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stripe API Keys</CardTitle>
          {keyStatus.source === 'database' && (
            <Badge>Stored in database</Badge>
          )}
          {keyStatus.source === 'env' && (
            <Badge variant="secondary">Using environment variables</Badge>
          )}
          {keyStatus.source === 'none' && (
            <Badge variant="destructive">Not configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {keyStatus.source !== 'none' && (
          <div className="mb-6 space-y-2 rounded-md bg-muted p-4 text-sm">
            <p><span className="font-medium">Publishable key:</span> {keyStatus.publishableKey ?? 'Not set'}</p>
            <p><span className="font-medium">Secret key:</span> {keyStatus.secretKey ?? 'Not set'}</p>
            <p><span className="font-medium">Webhook secret:</span> {keyStatus.webhookSecret ?? 'Not set'}</p>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publishable_key">Publishable Key</Label>
            <Input
              id="publishable_key"
              name="publishable_key"
              type="password"
              placeholder="pk_live_..."
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret_key">Secret Key</Label>
            <Input
              id="secret_key"
              name="secret_key"
              type="password"
              placeholder="sk_live_..."
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_secret">Webhook Secret</Label>
            <Input
              id="webhook_secret"
              name="webhook_secret"
              type="password"
              placeholder="whsec_..."
              autoComplete="off"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-600">{state.success}</p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Stripe Keys'}
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Keys are encrypted at rest. You must re-enter all three keys to update — existing values are never sent back to the browser.
        </p>
      </CardContent>
    </Card>
  )
}
