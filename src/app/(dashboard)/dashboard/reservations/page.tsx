import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export default async function MyReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, boat:boats(name), time_slot:time_slots(name, start_time, end_time)')
    .eq('user_id', user!.id)
    .order('date', { ascending: false })

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">My Reservations</h2>
        <Button asChild>
          <Link href="/dashboard/book">Book a Boat</Link>
        </Button>
      </div>

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
          {reservations && reservations.length > 0 ? (
            reservations.map((res) => {
              const isFuture = res.date >= today
              const canCancel = res.status === 'active' && isFuture

              return (
                <TableRow key={res.id}>
                  <TableCell className="font-medium">{res.boat?.name}</TableCell>
                  <TableCell>{res.date}</TableCell>
                  <TableCell>{res.time_slot?.name} ({res.time_slot?.start_time}–{res.time_slot?.end_time})</TableCell>
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
                No reservations yet. <Link href="/dashboard/book" className="underline">Book a boat</Link> to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
