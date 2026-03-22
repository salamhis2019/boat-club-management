import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toggleBoatActive } from '@/app/actions/boats'
import { DataTable, type Column } from '@/components/data-table'
import { parsePage, paginationRange, buildPaginationMeta, PAGE_SIZE } from '@/lib/pagination'
import Link from 'next/link'

type BoatRow = {
  id: string
  name: string
  capacity: number
  horsepower: string | null
  is_active: boolean
}

export default async function BoatsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage({ page: pageParam })

  const supabase = await createClient()
  const { from, to } = paginationRange(page, PAGE_SIZE)

  const { data: boats, count } = await supabase
    .from('boats')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const displayed = (boats ?? []) as BoatRow[]
  const total = count ?? 0
  const pagination = buildPaginationMeta(page, total)

  const columns: Column<BoatRow>[] = [
    {
      header: 'Name',
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: 'Capacity',
      cell: (row) => row.capacity,
    },
    {
      header: 'Horsepower',
      cell: (row) => row.horsepower || '—',
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/boats/${row.id}`}>Edit</Link>
          </Button>
          <form action={toggleBoatActive.bind(null, row.id)}>
            <Button variant="ghost" size="sm">
              {row.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </form>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Boats</h2>
        <Button asChild>
          <Link href="/admin/boats/new">Add Boat</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={displayed}
        emptyMessage="No boats yet. Add your first boat to get started."
        pagination={pagination}
        baseUrl="/admin/boats"
      />
    </div>
  )
}
