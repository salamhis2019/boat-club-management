'use client'

import { useState, useEffect, useActionState } from 'react'
import { createReservation, type ReservationActionState } from '@/app/actions/reservations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Slot = {
  id: string
  name: string
  start_time: string
  end_time: string
}

type BoatWithSlots = {
  id: string
  name: string
  description: string | null
  capacity: number
  image_url: string | null
  available_slots: Slot[]
}

export default function BookPage() {
  const [state, formAction, pending] = useActionState<ReservationActionState, FormData>(createReservation, null)
  const [date, setDate] = useState('')
  const [availability, setAvailability] = useState<BoatWithSlots[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<{ boat_id: string; time_slot_id: string } | null>(null)

  // Min date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  useEffect(() => {
    if (!date) {
      setAvailability([])
      return
    }
    setLoading(true)
    setSelected(null)
    fetch(`/api/reservations/available?date=${date}`)
      .then((res) => res.json())
      .then((data) => setAvailability(data.availability ?? []))
      .finally(() => setLoading(false))
  }, [date])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Book a Boat</h2>

      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="max-w-xs space-y-2">
        <Label htmlFor="date">Select a date</Label>
        <Input
          id="date"
          type="date"
          min={minDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading available boats...</p>}

      {!loading && date && availability.length === 0 && (
        <p className="text-sm text-muted-foreground">No boats available on this date.</p>
      )}

      {!loading && availability.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availability.map((boat) => (
            <Card key={boat.id}>
              <CardHeader>
                <CardTitle className="text-lg">{boat.name}</CardTitle>
                {boat.description && (
                  <p className="text-sm text-muted-foreground">{boat.description}</p>
                )}
                <p className="text-xs text-muted-foreground">Capacity: {boat.capacity}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {boat.available_slots.map((slot) => {
                  const isSelected = selected?.boat_id === boat.id && selected?.time_slot_id === slot.id
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelected({ boat_id: boat.id, time_slot_id: slot.id })}
                      className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10 font-medium'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {slot.name} ({slot.start_time}–{slot.end_time})
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <form action={formAction}>
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="boat_id" value={selected.boat_id} />
          <input type="hidden" name="time_slot_id" value={selected.time_slot_id} />
          <Button type="submit" disabled={pending} size="lg">
            {pending ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </form>
      )}
    </div>
  )
}
