import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangleIcon, DollarSignIcon } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = createServiceClient()

  const [{ count: pendingCount }, { count: failedCount }] = await Promise.all([
    supabase.from('charges').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('charges').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
  ])

  const hasPendingCharges = (pendingCount ?? 0) > 0
  const hasFailedCharges = (failedCount ?? 0) > 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

      {hasFailedCharges && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangleIcon className="size-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                {failedCount} failed payment{failedCount !== 1 ? 's' : ''} require attention
              </p>
              <p className="text-xs text-muted-foreground">Review and retry these charges.</p>
            </div>
            <Link
              href="/admin/charges?view=failed"
              className="text-sm font-medium text-destructive underline"
            >
              View
            </Link>
          </CardContent>
        </Card>
      )}

      {hasPendingCharges && (
        <Card className="border-amber-500/50 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <DollarSignIcon className="size-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700">
                {pendingCount} pending charge{pendingCount !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">Members have not yet been charged.</p>
            </div>
            <Link
              href="/admin/charges?view=pending"
              className="text-sm font-medium text-amber-700 underline"
            >
              View
            </Link>
          </CardContent>
        </Card>
      )}

      {!hasFailedCharges && !hasPendingCharges && (
        <p className="text-muted-foreground">
          Welcome to the admin dashboard. All payments are up to date.
        </p>
      )}
    </div>
  )
}
