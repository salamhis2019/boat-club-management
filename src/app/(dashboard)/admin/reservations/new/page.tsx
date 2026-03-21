'use client'

import { useState, useEffect, useActionState } from 'react'
import { createReservationOnBehalf, type ReservationActionState } from '@/app/actions/reservations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type Boat = {
  id: string
  name: string
  available_slots: { id: string; name: string; start_time: string; end_time: string }[]
}

type Member = {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function AdminNewReservationPage() {
  const [state, formAction, pending] = useActionState<ReservationActionState, FormData>(createReservationOnBehalf, null)
  const [date, setDate] = useState('')
  const [availability, setAvailability] = useState<Boat[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedBoat, setSelectedBoat] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch members on mount
  useEffect(() => {
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => setMembers(data.members ?? []))
  }, [])

  // Fetch availability when date changes
  useEffect(() => {
    if (!date) {
      setAvailability([])
      return
    }
    setLoading(true)
    setSelectedBoat('')
    setSelectedSlot('')
    fetch(`/api/reservations/available?date=${date}`)
      .then((res) => res.json())
      .then((data) => setAvailability(data.availability ?? []))
      .finally(() => setLoading(false))
  }, [date])

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Book on Behalf of Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            {/* Member select */}
            <div className="space-y-2">
              <Label htmlFor="user_id">Member *</Label>
              <select
                id="user_id"
                name="user_id"
                required
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Boat + Slot selection */}
            {loading && <p className="text-sm text-muted-foreground">Loading availability...</p>}

            {!loading && date && availability.length === 0 && (
              <p className="text-sm text-muted-foreground">No boats available on this date.</p>
            )}

            {!loading && availability.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="boat_id">Boat *</Label>
                  <select
                    id="boat_id"
                    name="boat_id"
                    required
                    value={selectedBoat}
                    onChange={(e) => {
                      setSelectedBoat(e.target.value)
                      setSelectedSlot('')
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select a boat</option>
                    {availability.map((boat) => (
                      <option key={boat.id} value={boat.id}>
                        {boat.name} ({boat.available_slots.length} slot{boat.available_slots.length !== 1 ? 's' : ''} available)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBoat && (
                  <div className="space-y-2">
                    <Label htmlFor="time_slot_id">Time Slot *</Label>
                    <select
                      id="time_slot_id"
                      name="time_slot_id"
                      required
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select a time slot</option>
                      {availability
                        .find((b) => b.id === selectedBoat)
                        ?.available_slots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.name} ({slot.start_time}–{slot.end_time})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending || !selectedUser || !selectedBoat || !selectedSlot}>
                {pending ? 'Booking...' : 'Book Reservation'}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/reservations">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
