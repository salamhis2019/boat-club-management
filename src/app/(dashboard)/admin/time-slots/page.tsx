import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toggleTimeSlotActive, deleteTimeSlot } from '@/app/actions/time-slots'
import { DataTable, type Column } from '@/components/data-table'
import Link from 'next/link'

type TimeSlotRow = {
  id: string
  name: string
  start_time: string
  end_time: string
  is_active: boolean
}

export default async function TimeSlotsPage() {
  const supabase = await createClient()
  const { data: timeSlots } = await supabase
    .from('time_slots')
    .select('*')
    .order('start_time', { ascending: true })

  const columns: Column<TimeSlotRow>[] = [
    {
      header: 'Name',
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: 'Start Time',
      cell: (row) => row.start_time,
    },
    {
      header: 'End Time',
      cell: (row) => row.end_time,
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
          <form action={toggleTimeSlotActive.bind(null, row.id)}>
            <Button variant="outline" size="sm">
              {row.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </form>
          <form action={deleteTimeSlot.bind(null, row.id)}>
            <Button variant="destructive" size="sm">Delete</Button>
          </form>
        </div>
      ),
    },
  ]

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

      <DataTable
        columns={columns}
        data={(timeSlots ?? []) as TimeSlotRow[]}
        emptyMessage="No time slots configured."
      />
    </div>
  )
}
