'use client'

import { useState, useEffect, useActionState } from 'react'
import { createReservationOnBehalf, type ReservationActionState } from '@/app/actions/reservations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSelect } from '@/components/form-select'
import Link from 'next/link'

type Slot = {
  id: string
  name: string
  start_time: string
  end_time: string
  available: boolean
}

type Boat = {
  id: string
  name: string
  slots: Slot[]
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
              <Label>Member *</Label>
              <FormSelect
                name="user_id"
                placeholder="Select a member"
                value={selectedUser}
                onChange={setSelectedUser}
                required
                options={members.map((m) => ({
                  value: m.id,
                  label: `${m.first_name} ${m.last_name} (${m.email})`,
                }))}
              />
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
                  <Label>Boat *</Label>
                  <FormSelect
                    name="boat_id"
                    placeholder="Select a boat"
                    value={selectedBoat}
                    onChange={(val) => {
                      setSelectedBoat(val)
                      setSelectedSlot('')
                    }}
                    required
                    options={availability.map((boat) => {
                      const availableCount = boat.slots.filter((s) => s.available).length
                      return {
                        value: boat.id,
                        label: `${boat.name} (${availableCount} slot${availableCount !== 1 ? 's' : ''} available)`,
                      }
                    })}
                  />
                </div>

                {selectedBoat && (
                  <div className="space-y-2">
                    <Label>Time Slot *</Label>
                    <FormSelect
                      name="time_slot_id"
                      placeholder="Select a time slot"
                      value={selectedSlot}
                      onChange={setSelectedSlot}
                      required
                      options={
                        availability
                          .find((b) => b.id === selectedBoat)
                          ?.slots.filter((slot) => slot.available).map((slot) => ({
                            value: slot.id,
                            label: `${slot.name} (${slot.start_time}–${slot.end_time})`,
                          })) ?? []
                      }
                    />
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
