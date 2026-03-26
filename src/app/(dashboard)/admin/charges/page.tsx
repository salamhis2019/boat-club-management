import { createServiceClient } from '@/lib/supabase/service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TabSwitcher } from '@/components/tab-switcher'
import { DataTable, type Column } from '@/components/data-table'
import { parsePage, paginationRange, buildPaginationMeta, PAGE_SIZE } from '@/lib/pagination'
import Link from 'next/link'
import { RetryChargeButton } from '@/components/billing/retry-charge-button'
import { CancelChargeButton } from '@/components/billing/cancel-charge-button'

type ChargeRow = {
  id: string
  invoice_number: string | null
  user: { first_name: string; last_name: string; email: string } | null
  amount: number
  type: string
  description: string
  status: string
  created_at: string
}

export default async function AdminChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>
}) {
  const { view, page: pageParam } = await searchParams
  const tab = view === 'paid' ? 'paid' : view === 'failed' ? 'failed' : 'pending'
  const page = parsePage({ page: pageParam })

  const supabase = createServiceClient()

  // Count queries for tab badges (lightweight)
  const [{ count: pendingCount }, { count: paidCount }, { count: failedCount }] = await Promise.all([
    supabase.from('charges').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('charges').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('charges').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
  ])

  // Paginated query for current tab
  const { from, to } = paginationRange(page, PAGE_SIZE)
  const { data: charges, count } = await supabase
    .from('charges')
    .select('*, user:users!charges_user_id_fkey(first_name, last_name, email)', { count: 'exact' })
    .eq('status', tab)
    .order('created_at', { ascending: false })
    .range(from, to)

  const displayed = (charges ?? []) as ChargeRow[]
  const total = count ?? 0
  const pagination = buildPaginationMeta(page, total)

  const statusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default' as const
      case 'failed': return 'destructive' as const
      default: return 'secondary' as const
    }
  }

  const columns: Column<ChargeRow>[] = [
    {
      header: 'Invoice',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.invoice_number ?? '—'}
        </span>
      ),
    },
    {
      header: 'Member',
      cell: (row) => (
        <div>
          <div className="font-medium">
            {row.user?.first_name} {row.user?.last_name}
          </div>
          <div className="text-xs text-muted-foreground">{row.user?.email}</div>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (row) => <span className="font-medium">${row.amount.toFixed(2)}</span>,
    },
    {
      header: 'Type',
      cell: (row) => <span className="capitalize">{row.type}</span>,
    },
    {
      header: 'Description',
      className: 'max-w-[200px] truncate',
      cell: (row) => row.description,
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === 'failed' && <RetryChargeButton chargeId={row.id} />}
          {row.status === 'pending' && (
            <CancelChargeButton chargeId={row.id} />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Charges</h2>
        <Button asChild>
          <Link href="/admin/charges/new">Create Charge</Link>
        </Button>
      </div>

      <TabSwitcher tabs={[
        { label: 'Pending', href: '/admin/charges?view=pending', count: pendingCount ?? 0, active: tab === 'pending' },
        { label: 'Paid', href: '/admin/charges?view=paid', count: paidCount ?? 0, active: tab === 'paid' },
        { label: 'Failed', href: '/admin/charges?view=failed', count: failedCount ?? 0, active: tab === 'failed' },
      ]} />

      <DataTable
        columns={columns}
        data={displayed}
        emptyMessage={`No ${tab} charges.`}
        pagination={pagination}
        baseUrl={`/admin/charges?view=${tab}`}
      />
    </div>
  )
}
