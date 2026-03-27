import { createServiceClient } from '@/lib/supabase/service'
import { RuleStatusBadge } from '@/components/club-rules/rule-status-badge'
import { DataTable, type Column } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { SetActiveButton, DeleteRuleButton, PreviewRuleButton } from './actions'

type ClubRuleRow = {
  id: string
  title: string
  version: number
  is_active: boolean
  created_at: string
  uploaded_by_user: { first_name: string; last_name: string } | null
  signature_count: number
}

export default async function AdminClubRulesPage() {
  const supabase = createServiceClient()

  const { data: rules } = await supabase
    .from('club_rules')
    .select('*, uploaded_by_user:users!club_rules_uploaded_by_fkey(first_name, last_name)')
    .order('created_at', { ascending: false })

  // Get member count for signature tracking
  const { count: memberCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'member')

  // Get signature counts per rule
  const ruleIds = (rules ?? []).map((r) => r.id)
  let signatureCounts: Record<string, number> = {}

  if (ruleIds.length > 0) {
    const { data: sigs } = await supabase
      .from('club_rule_signatures')
      .select('club_rule_id')
      .in('club_rule_id', ruleIds)

    if (sigs) {
      signatureCounts = sigs.reduce((acc, s) => {
        acc[s.club_rule_id] = (acc[s.club_rule_id] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  const displayed: ClubRuleRow[] = (rules ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    version: r.version,
    is_active: r.is_active,
    created_at: r.created_at,
    uploaded_by_user: r.uploaded_by_user as { first_name: string; last_name: string } | null,
    signature_count: signatureCounts[r.id] ?? 0,
  }))

  const columns: Column<ClubRuleRow>[] = [
    {
      header: 'Title',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.title}</div>
          <div className="text-xs text-muted-foreground">Version {row.version}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <RuleStatusBadge variant={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      header: 'Signatures',
      cell: (row) => (
        <Link
          href={`/admin/club-rules/${row.id}/signatures`}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Users className="size-3.5" />
          {row.signature_count} / {memberCount ?? 0}
        </Link>
      ),
    },
    {
      header: 'Uploaded',
      cell: (row) => (
        <div>
          <div className="text-sm">{new Date(row.created_at).toLocaleDateString()}</div>
          {row.uploaded_by_user && (
            <div className="text-xs text-muted-foreground">
              by {row.uploaded_by_user.first_name} {row.uploaded_by_user.last_name}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <PreviewRuleButton ruleId={row.id} />
          {!row.is_active && <SetActiveButton ruleId={row.id} />}
          {!row.is_active && <DeleteRuleButton ruleId={row.id} />}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Club Rules</h2>
        <Button asChild>
          <Link href="/admin/club-rules/new">
            <Plus className="mr-2 size-4" />
            Upload New Rules
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={displayed}
        emptyMessage="No club rules uploaded yet."
      />
    </div>
  )
}
