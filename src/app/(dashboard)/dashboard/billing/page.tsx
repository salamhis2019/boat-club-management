import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentMethodsList } from '@/components/billing/payment-methods-list'
import { PayChargeButton } from '@/components/billing/pay-charge-button'
import { getPaymentMethods, getDefaultPaymentMethodId } from '@/app/actions/billing'
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

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const serviceClient = createServiceClient()
  const { data: charges } = await serviceClient
    .from('charges')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const paymentMethods = await getPaymentMethods()
  const defaultPmId = await getDefaultPaymentMethodId()

  const statusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default' as const
      case 'failed': return 'destructive' as const
      default: return 'secondary' as const
    }
  }

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(charges ?? []).length > 0 ? (
                  (charges ?? []).map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {charge.invoice_number ?? '—'}
                      </TableCell>
                      <TableCell className="font-medium">{charge.description}</TableCell>
                      <TableCell className="capitalize">{charge.type}</TableCell>
                      <TableCell>${charge.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(charge.status)}>
                          {charge.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(charge.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(charge.status === 'pending' || charge.status === 'failed') && (
                          <PayChargeButton chargeId={charge.id} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No charges yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
