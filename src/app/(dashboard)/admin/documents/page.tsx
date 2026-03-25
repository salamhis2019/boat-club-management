import { createServiceClient } from '@/lib/supabase/service'
import { Badge } from '@/components/ui/badge'
import { TabSwitcher } from '@/components/tab-switcher'
import { DataTable, type Column } from '@/components/data-table'
import { DocumentPreviewButton } from '@/components/documents/document-preview-button'
import { ApproveButton, RejectButton, RevokeButton } from '@/components/documents/document-action-buttons'
import { parsePage, paginationRange, buildPaginationMeta, PAGE_SIZE } from '@/lib/pagination'

type DocumentRow = {
  id: string
  type: string
  uploaded_at: string
  approved: boolean
  user: { first_name: string; last_name: string; email: string } | null
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>
}) {
  const { view, page: pageParam } = await searchParams
  const tab = view === 'approved' ? true : false
  const page = parsePage({ page: pageParam })

  const supabase = createServiceClient()

  // Count queries for tab badges
  const [{ count: pendingCount }, { count: approvedCount }] = await Promise.all([
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('approved', false),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('approved', true),
  ])

  // Paginated query
  const { from, to } = paginationRange(page, PAGE_SIZE)
  const { data: documents, count } = await supabase
    .from('documents')
    .select('*, user:users!documents_user_id_fkey(first_name, last_name, email)', { count: 'exact' })
    .eq('approved', tab)
    .order('uploaded_at', { ascending: false })
    .range(from, to)

  const displayed = (documents ?? []) as DocumentRow[]
  const total = count ?? 0
  const pagination = buildPaginationMeta(page, total)

  const docTypeLabel = (type: string) => {
    switch (type) {
      case 'waiver': return 'Waiver'
      case 'drivers_license': return "Driver's License"
      default: return type
    }
  }

  const columns: Column<DocumentRow>[] = [
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
      header: 'Document Type',
      cell: (row) => <Badge variant="outline">{docTypeLabel(row.type)}</Badge>,
    },
    {
      header: 'Upload Date',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.uploaded_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => row.approved ? (
        <Badge variant="default" className="bg-green-600 text-white hover:bg-green-600">Approved</Badge>
      ) : (
        <Badge variant="secondary">Pending</Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <DocumentPreviewButton documentId={row.id} />
          {!row.approved && (
            <>
              <ApproveButton documentId={row.id} />
              <RejectButton documentId={row.id} />
            </>
          )}
          {row.approved && (
            <RevokeButton documentId={row.id} />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Documents</h2>

      <TabSwitcher tabs={[
        { label: 'Pending', href: '/admin/documents?view=pending', count: pendingCount ?? 0, active: !tab },
        { label: 'Approved', href: '/admin/documents?view=approved', count: approvedCount ?? 0, active: tab },
      ]} />

      <DataTable
        columns={columns}
        data={displayed}
        emptyMessage={tab ? 'No approved documents.' : 'No pending documents.'}
        pagination={pagination}
        baseUrl={`/admin/documents?view=${view ?? 'pending'}`}
      />
    </div>
  )
}
