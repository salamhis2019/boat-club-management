import { createClient } from '@/lib/supabase/server'
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
import { toggleTimeSlotActive, deleteTimeSlot } from '@/app/actions/time-slots'
import Link from 'next/link'

export default async function TimeSlotsPage() {
  const supabase = await createClient()
  const { data: timeSlots } = await supabase
    .from('time_slots')
    .select('*')
    .order('start_time', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Time Slots</h2>
          <p className="text-sm text-muted-foreground">
            Manage booking time slots. Toggle active/inactive for daylight savings adjustments.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/time-slots/new">Add Time Slot</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeSlots && timeSlots.length > 0 ? (
            timeSlots.map((slot) => (
              <TableRow key={slot.id}>
                <TableCell className="font-medium">{slot.name}</TableCell>
                <TableCell>{slot.start_time}</TableCell>
                <TableCell>{slot.end_time}</TableCell>
                <TableCell>
                  <Badge variant={slot.is_active ? 'default' : 'secondary'}>
                    {slot.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <form action={toggleTimeSlotActive.bind(null, slot.id)}>
                      <Button variant="outline" size="sm">
                        {slot.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </form>
                    <form action={deleteTimeSlot.bind(null, slot.id)}>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No time slots configured.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
