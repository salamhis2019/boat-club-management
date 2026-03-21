import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateString, formatTime } from '@/lib/helpers/date.helper'
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

export default async function MyReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const tab = view === 'past' ? 'past' : 'upcoming'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, boat:boats(name), time_slot:time_slots(name, start_time, end_time)')
    .eq('user_id', user!.id)
    .order('date', { ascending: true })

  const today = formatDateString(new Date())
  const upcoming = (reservations ?? []).filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = (reservations ?? []).filter((r) => r.date < today).sort((a, b) => b.date.localeCompare(a.date))
  const displayed = tab === 'upcoming' ? upcoming : past

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">My Reservations</h2>
        <Button asChild>
          <Link href="/dashboard/book">Book a Boat</Link>
        </Button>
      </div>

      <TabSwitcher tabs={[
        { label: 'Upcoming', href: '/dashboard/reservations?view=upcoming', count: upcoming.length, active: tab === 'upcoming' },
        { label: 'Past', href: '/dashboard/reservations?view=past', count: past.length, active: tab === 'past' },
      ]} />

      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Boat</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time Slot</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayed.length > 0 ? (
            displayed.map((res) => {
              const isFuture = res.date >= today
              const canCancel = res.status === 'active' && isFuture

              return (
                <TableRow key={res.id}>
                  <TableCell className="font-medium">{res.boat?.name}</TableCell>
                  <TableCell>{res.date}</TableCell>
                  <TableCell>{res.time_slot?.name} ({formatTime(res.time_slot?.start_time ?? '')}–{formatTime(res.time_slot?.end_time ?? '')})</TableCell>
                  <TableCell>
                    <Badge variant={res.status === 'active' ? 'default' : 'secondary'}>
                      {res.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canCancel && (
                      <form action={cancelReservation.bind(null, res.id)}>
                        <Button variant="destructive" size="sm">
                          Cancel
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {tab === 'upcoming' ? (
                  <>No upcoming reservations. <Link href="/dashboard/book" className="underline">Book a boat</Link> to get started.</>
                ) : (
                  'No past reservations.'
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
