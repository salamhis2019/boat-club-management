import { createServiceClient } from '@/lib/supabase/service'
import { DataTable, type Column } from '@/components/data-table'
import { RuleStatusBadge } from '@/components/club-rules/rule-status-badge'
import { DownloadSignedPdfButton } from './download-button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type SignatureRow = {
  id: string
  signed_at: string
  signature_url: string
  user: { first_name: string; last_name: string; email: string } | null
}

export default async function AdminRuleSignaturesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  // Get the rule
  const { data: rule } = await supabase
    .from('club_rules')
    .select('id, title, version, is_active')
    .eq('id', id)
    .single()

  if (!rule) notFound()

  // Get all signatures for this rule
  const { data: signatures } = await supabase
    .from('club_rule_signatures')
    .select('*, user:users!club_rule_signatures_user_id_fkey(first_name, last_name, email)')
    .eq('club_rule_id', id)
    .order('signed_at', { ascending: false })

  // Get members who haven't signed
  const signedUserIds = (signatures ?? []).map((s) => s.user_id)
  let unsignedQuery = supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('role', 'member')

  if (signedUserIds.length > 0) {
    unsignedQuery = unsignedQuery.not('id', 'in', `(${signedUserIds.join(',')})`)
  }

  const { data: unsignedMembers } = await unsignedQuery

  const displayed = (signatures ?? []) as SignatureRow[]

  const signedColumns: Column<SignatureRow>[] = [
    {
      header: 'Member',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.user?.first_name} {row.user?.last_name}</div>
          <div className="text-xs text-muted-foreground">{row.user?.email}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: () => <RuleStatusBadge variant="signed" />,
    },
    {
      header: 'Signed Date',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.signed_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Signed Document',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end">
          <DownloadSignedPdfButton signatureUrl={row.signature_url} memberName={`${row.user?.first_name} ${row.user?.last_name}`} />
        </div>
      ),
    },
  ]

  type UnsignedRow = { id: string; first_name: string; last_name: string; email: string }

  const unsignedColumns: Column<UnsignedRow>[] = [
    {
      header: 'Member',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.first_name} {row.last_name}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: () => <RuleStatusBadge variant="not_signed" />,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/club-rules" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          Back to Club Rules
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">
          {rule.title}
          <span className="ml-2 text-base font-normal text-muted-foreground">v{rule.version}</span>
        </h2>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">
          Signed ({displayed.length})
        </h3>
        <DataTable
          columns={signedColumns}
          data={displayed}
          emptyMessage="No members have signed yet."
        />
      </div>

      {(unsignedMembers ?? []).length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">
            Not Signed ({(unsignedMembers ?? []).length})
          </h3>
          <DataTable
            columns={unsignedColumns}
            data={(unsignedMembers ?? []) as UnsignedRow[]}
            emptyMessage=""
          />
        </div>
      )}
    </div>
  )
}
