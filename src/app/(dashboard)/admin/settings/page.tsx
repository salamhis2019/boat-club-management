import { getStripeKeyStatus } from '@/app/actions/settings'
import { StripeKeysForm } from '@/components/admin/stripe-keys-form'

export default async function SettingsPage() {
  const keyStatus = await getStripeKeyStatus()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
      <StripeKeysForm keyStatus={keyStatus} />
    </div>
  )
}
