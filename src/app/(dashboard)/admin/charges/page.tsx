import { createServiceClient } from '@/lib/supabase/service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cancelCharge } from '@/app/actions/charges'
import { TabSwitcher } from '@/components/tab-switcher'
import Link from 'next/link'
import { RetryChargeButton } from '@/components/billing/retry-charge-button'

export default async function AdminChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const tab = view === 'paid' ? 'paid' : view === 'failed' ? 'failed' : 'pending'

  const supabase = createServiceClient()

  const { data: charges } = await supabase
    .from('charges')
    .select('*, user:users!charges_user_id_fkey(first_name, last_name, email)')
    .order('created_at', { ascending: false })

  const allCharges = charges ?? []
  const pending = allCharges.filter((c) => c.status === 'pending')
  const paid = allCharges.filter((c) => c.status === 'paid')
  const failed = allCharges.filter((c) => c.status === 'failed')

  const displayed = tab === 'paid' ? paid : tab === 'failed' ? failed : pending

  const statusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default' as const
      case 'failed': return 'destructive' as const
      default: return 'secondary' as const
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Charges</h2>
        <Button asChild>
          <Link href="/admin/charges/new">Create Charge</Link>
        </Button>
      </div>

      <TabSwitcher tabs={[
        { label: 'Pending', href: '/admin/charges?view=pending', count: pending.length, active: tab === 'pending' },
        { label: 'Paid', href: '/admin/charges?view=paid', count: paid.length, active: tab === 'paid' },
        { label: 'Failed', href: '/admin/charges?view=failed', count: failed.length, active: tab === 'failed' },
      ]} />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length > 0 ? (
              displayed.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {charge.invoice_number ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {charge.user?.first_name} {charge.user?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{charge.user?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${charge.amount.toFixed(2)}</TableCell>
                  <TableCell className="capitalize">{charge.type}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{charge.description}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(charge.status)}>
                      {charge.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(charge.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {charge.status === 'failed' && (
                        <RetryChargeButton chargeId={charge.id} />
                      )}
                      {charge.status === 'pending' && (
                        <form action={cancelCharge.bind(null, charge.id)}>
                          <Button variant="destructive" size="sm">
                            Cancel
                          </Button>
                        </form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No {tab} charges.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
