import { createServiceClient } from '@/lib/supabase/service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cancelReservation } from '@/app/actions/reservations'
import { TabSwitcher } from '@/components/tab-switcher'
import Link from 'next/link'
import { formatDateString, formatTime } from '@/lib/helpers/date.helper'

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const tab = view === 'past' ? 'past' : 'upcoming'

  const supabase = createServiceClient()
  const today = formatDateString(new Date())

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, boat:boats(name), time_slot:time_slots(name, start_time, end_time), user:users!reservations_user_id_fkey(first_name, last_name, email)')
    .order('date', { ascending: tab === 'upcoming' })

  const upcoming = (reservations ?? []).filter((r) => r.date >= today)
  const past = (reservations ?? []).filter((r) => r.date < today)
  const displayed = tab === 'upcoming' ? upcoming : past

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Reservations</h2>
        <Button asChild>
          <Link href="/admin/reservations/new">Book on Behalf</Link>
        </Button>
      </div>

      <TabSwitcher tabs={[
        { label: 'Upcoming', href: '/admin/reservations?view=upcoming', count: upcoming.length, active: tab === 'upcoming' },
        { label: 'Past', href: '/admin/reservations?view=past', count: past.length, active: tab === 'past' },
      ]} />

      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Boat</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time Slot</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayed.length > 0 ? (
            displayed.map((res) => (
              <TableRow key={res.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {res.user?.first_name} {res.user?.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{res.user?.email}</div>
                  </div>
                </TableCell>
                <TableCell>{res.boat?.name}</TableCell>
                <TableCell>{res.date}</TableCell>
                <TableCell>{res.time_slot?.name} ({formatTime(res.time_slot?.start_time ?? '')}–{formatTime(res.time_slot?.end_time ?? '')})</TableCell>
                <TableCell>
                  <Badge variant={res.status === 'active' ? 'default' : 'secondary'}>
                    {res.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {res.status === 'active' && res.date >= today && (
                    <form action={cancelReservation.bind(null, res.id)}>
                      <Button variant="destructive" size="sm">
                        Cancel
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {tab === 'upcoming' ? 'No upcoming reservations.' : 'No past reservations.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
