import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentMethodsList } from '@/components/billing/payment-methods-list'
import { PayChargeButton } from '@/components/billing/pay-charge-button'
import { getPaymentMethods, getDefaultPaymentMethodId } from '@/app/actions/billing'
import { DataTable, type Column } from '@/components/data-table'
import { parsePage, paginationRange, buildPaginationMeta, PAGE_SIZE } from '@/lib/pagination'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'

function AddCardButton() {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/dashboard/billing/add">
        <PlusIcon className="mr-1.5 size-4" />
        Add Card
      </Link>
    </Button>
  )
}

type ChargeRow = {
  id: string
  invoice_number: string | null
  description: string
  type: string
  amount: number
  status: string
  created_at: string
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage({ page: pageParam })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const serviceClient = createServiceClient()
  const { from, to } = paginationRange(page, PAGE_SIZE)

  const { data: charges, count } = await serviceClient
    .from('charges')
    .select('*', { count: 'exact' })
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const displayed = (charges ?? []) as ChargeRow[]
  const total = count ?? 0
  const pagination = buildPaginationMeta(page, total)

  const paymentMethods = await getPaymentMethods()
  const defaultPmId = await getDefaultPaymentMethodId()

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
      header: 'Description',
      cell: (row) => <span className="font-medium">{row.description}</span>,
    },
    {
      header: 'Type',
      cell: (row) => <span className="capitalize">{row.type}</span>,
    },
    {
      header: 'Amount',
      cell: (row) => `$${row.amount.toFixed(2)}`,
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
        <>
          {(row.status === 'pending' || row.status === 'failed') && (
            <PayChargeButton chargeId={row.id} />
          )}
        </>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Billing</h2>

      {/* Payment Methods */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Payment Methods</CardTitle>
          <AddCardButton />
        </CardHeader>
        <CardContent>
          {paymentMethods.length > 0 ? (
            <PaymentMethodsList methods={paymentMethods} defaultId={defaultPmId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No payment methods on file. Add one to enable automatic payments.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Charges</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={displayed}
            emptyMessage="No charges yet."
            pagination={pagination}
            baseUrl="/dashboard/billing"
          />
        </CardContent>
      </Card>
    </div>
  )
}
