import { createServiceClient } from '@/lib/supabase/service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cancelReservation } from '@/app/actions/reservations'
import { TabSwitcher } from '@/components/tab-switcher'
import { DataTable, type Column } from '@/components/data-table'
import { parsePage, paginationRange, buildPaginationMeta, PAGE_SIZE } from '@/lib/pagination'
import Link from 'next/link'
import { formatDateString, formatTime } from '@/lib/helpers/date.helper'

type ReservationRow = {
  id: string
  date: string
  status: string
  user: { first_name: string; last_name: string; email: string } | null
  boat: { name: string } | null
  time_slot: { name: string; start_time: string; end_time: string } | null
}

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>
}) {
  const { view, page: pageParam } = await searchParams
  const tab = view === 'past' ? 'past' : 'upcoming'
  const page = parsePage({ page: pageParam })

  const supabase = createServiceClient()
  const today = formatDateString(new Date())

  // Count queries for tab badges
  const [{ count: upcomingCount }, { count: pastCount }] = await Promise.all([
    supabase.from('reservations').select('*', { count: 'exact', head: true }).gte('date', today),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).lt('date', today),
  ])

  // Paginated query for current tab
  const { from, to } = paginationRange(page, PAGE_SIZE)
  let query = supabase
    .from('reservations')
    .select('*, boat:boats(name), time_slot:time_slots(name, start_time, end_time), user:users!reservations_user_id_fkey(first_name, last_name, email)', { count: 'exact' })

  if (tab === 'upcoming') {
    query = query.gte('date', today).order('date', { ascending: true })
  } else {
    query = query.lt('date', today).order('date', { ascending: false })
  }

  const { data: reservations, count } = await query.range(from, to)

  const displayed = (reservations ?? []) as ReservationRow[]
  const total = count ?? 0
  const pagination = buildPaginationMeta(page, total)

  const columns: Column<ReservationRow>[] = [
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
      header: 'Boat',
      cell: (row) => row.boat?.name,
    },
    {
      header: 'Date',
      cell: (row) => row.date,
    },
    {
      header: 'Time Slot',
      cell: (row) => (
        <>
          {row.time_slot?.name} ({formatTime(row.time_slot?.start_time ?? '')}–{formatTime(row.time_slot?.end_time ?? '')})
        </>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'default' : row.status === 'completed' ? 'outline' : 'secondary'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <>
          {row.status === 'active' && row.date >= today && (
            <form action={cancelReservation.bind(null, row.id)}>
              <Button variant="destructive" size="sm">Cancel</Button>
            </form>
          )}
        </>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Reservations</h2>
        <Button asChild>
          <Link href="/admin/reservations/new">Book on Behalf</Link>
        </Button>
      </div>

      <TabSwitcher tabs={[
        { label: 'Upcoming', href: '/admin/reservations?view=upcoming', count: upcomingCount ?? 0, active: tab === 'upcoming' },
        { label: 'Past', href: '/admin/reservations?view=past', count: pastCount ?? 0, active: tab === 'past' },
      ]} />

      <DataTable
        columns={columns}
        data={displayed}
        emptyMessage={tab === 'upcoming' ? 'No upcoming reservations.' : 'No past reservations.'}
        pagination={pagination}
        baseUrl={`/admin/reservations?view=${tab}`}
      />
    </div>
  )
}
