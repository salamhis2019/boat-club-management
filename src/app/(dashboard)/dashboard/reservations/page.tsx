import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateString, formatTime } from '@/lib/helpers/date.helper'
import { cancelReservation } from '@/app/actions/reservations'
import { TabSwitcher } from '@/components/tab-switcher'
import { DataTable, type Column } from '@/components/data-table'
import { parsePage, paginationRange, buildPaginationMeta, PAGE_SIZE } from '@/lib/pagination'
import Link from 'next/link'

type ReservationRow = {
  id: string
  date: string
  status: string
  boat: { name: string } | null
  time_slot: { name: string; start_time: string; end_time: string } | null
}

export default async function MyReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>
}) {
  const { view, page: pageParam } = await searchParams
  const tab = view === 'past' ? 'past' : 'upcoming'
  const page = parsePage({ page: pageParam })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const today = formatDateString(new Date())

  // Count queries for tab badges
  const [{ count: upcomingCount }, { count: pastCount }] = await Promise.all([
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).gte('date', today),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).lt('date', today),
  ])

  // Paginated query for current tab
  const { from, to } = paginationRange(page, PAGE_SIZE)
  let query = supabase
    .from('reservations')
    .select('*, boat:boats(name), time_slot:time_slots(name, start_time, end_time)', { count: 'exact' })
    .eq('user_id', user!.id)

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
      header: 'Boat',
      cell: (row) => <span className="font-medium">{row.boat?.name}</span>,
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
        <h2 className="text-2xl font-bold tracking-tight">My Reservations</h2>
        <Button asChild>
          <Link href="/dashboard/book">Book a Boat</Link>
        </Button>
      </div>

      <TabSwitcher tabs={[
        { label: 'Upcoming', href: '/dashboard/reservations?view=upcoming', count: upcomingCount ?? 0, active: tab === 'upcoming' },
        { label: 'Past', href: '/dashboard/reservations?view=past', count: pastCount ?? 0, active: tab === 'past' },
      ]} />

      <DataTable
        columns={columns}
        data={displayed}
        emptyMessage={
          tab === 'upcoming'
            ? 'No upcoming reservations. Book a boat to get started.'
            : 'No past reservations.'
        }
        pagination={pagination}
        baseUrl={`/dashboard/reservations?view=${tab}`}
      />
    </div>
  )
}
