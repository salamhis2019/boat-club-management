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
import Link from 'next/link'

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const tab = view === 'past' ? 'past' : 'upcoming'

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

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

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <Link
          href="/admin/reservations?view=upcoming"
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
            tab === 'upcoming'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upcoming ({upcoming.length})
        </Link>
        <Link
          href="/admin/reservations?view=past"
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
            tab === 'past'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Past ({past.length})
        </Link>
      </div>

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
                <TableCell>{res.time_slot?.name} ({res.time_slot?.start_time}–{res.time_slot?.end_time})</TableCell>
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
