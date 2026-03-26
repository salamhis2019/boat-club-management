import { createServiceClient } from '@/lib/supabase/service'
import { ROLES } from '@/lib/constants/roles.const'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toggleUserActive } from '@/app/actions/users'
import { TabSwitcher } from '@/components/tab-switcher'
import { DataTable, type Column } from '@/components/data-table'
import { SearchInput } from '@/components/search-input'
import { parsePage, paginationRange, buildPaginationMeta, PAGE_SIZE } from '@/lib/pagination'
import Link from 'next/link'

type UserRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  membership_type: string
  membership_active: boolean
  documents_approved: boolean
  is_active: boolean
  created_at: string
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string; search?: string }>
}) {
  const { view, page: pageParam, search } = await searchParams
  const tab = view === 'members' ? ROLES.MEMBER : view === 'admins' ? ROLES.ADMIN : 'all'
  const page = parsePage({ page: pageParam })

  const supabase = createServiceClient()

  // Count queries for tab badges
  const [{ count: allCount }, { count: memberCount }, { count: adminCount }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', ROLES.MEMBER),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', ROLES.ADMIN),
  ])

  // Paginated query
  const { from, to } = paginationRange(page, PAGE_SIZE)
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (tab !== 'all') {
    query = query.eq('role', tab)
  }

  if (search) {
    // Sanitize search input — strip PostgREST filter control characters to prevent injection
    const sanitized = search.replace(/[%_.,()\\]/g, '')
    if (sanitized) {
      query = query.or(`first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
    }
  }

  const { data: users, count } = await query

  const displayed = (users ?? []) as UserRow[]
  const total = count ?? 0
  const pagination = buildPaginationMeta(page, total)

  const roleVariant = (role: string) => {
    switch (role) {
      case ROLES.ADMIN: return 'default' as const
      case ROLES.MEMBER: return 'secondary' as const
      default: return 'outline' as const
    }
  }

  const columns: Column<UserRow>[] = [
    {
      header: 'Name',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.first_name} {row.last_name}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (row) => (
        <Badge variant={roleVariant(row.role)}>
          {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Membership',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="capitalize text-sm">{row.membership_type}</span>
          {row.membership_active ? (
            <Badge variant="default" className="bg-green-600 text-white hover:bg-green-600">Active</Badge>
          ) : (
            <Badge variant="destructive">Inactive</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Documents',
      cell: (row) => row.documents_approved ? (
        <Badge variant="default" className="bg-green-600 text-white hover:bg-green-600">Approved</Badge>
      ) : (
        <Badge variant="secondary">Pending</Badge>
      ),
    },
    {
      header: 'Status',
      cell: (row) => row.is_active ? (
        <Badge variant="default" className="bg-green-600 text-white hover:bg-green-600">Active</Badge>
      ) : (
        <Badge variant="destructive">Deactivated</Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/users/${row.id}`}>Edit</Link>
          </Button>
          <form action={toggleUserActive.bind(null, row.id)}>
            <Button variant="ghost" size="sm">
              {row.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </form>
        </div>
      ),
    },
  ]

  const searchSuffix = search ? `&search=${encodeURIComponent(search)}` : ''
  const viewParam = view ? view : 'all'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <Button asChild>
          <Link href="/admin/users/new">Create User</Link>
        </Button>
      </div>

      <SearchInput
        placeholder="Search by name or email..."
        baseUrl={`/admin/users${view ? `?view=${view}` : ''}`}
      />

      <TabSwitcher tabs={[
        { label: 'All', href: `/admin/users?view=all${searchSuffix}`, count: allCount ?? 0, active: tab === 'all' },
        { label: 'Members', href: `/admin/users?view=members${searchSuffix}`, count: memberCount ?? 0, active: tab === ROLES.MEMBER },
        { label: 'Admins', href: `/admin/users?view=admins${searchSuffix}`, count: adminCount ?? 0, active: tab === ROLES.ADMIN },
      ]} />

      <DataTable
        columns={columns}
        data={displayed}
        emptyMessage="No users found."
        pagination={pagination}
        baseUrl={`/admin/users?view=${viewParam}${searchSuffix}`}
      />
    </div>
  )
}
