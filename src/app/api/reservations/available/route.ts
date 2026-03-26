import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'A valid date (YYYY-MM-DD) is required' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Get all active boats, time slots, existing reservations, and blocked dates in parallel
  const [boatsRes, slotsRes, reservationsRes, blockedRes] = await Promise.all([
    serviceClient.from('boats').select('*').eq('is_active', true).order('name'),
    serviceClient.from('time_slots').select('*').eq('is_active', true).order('start_time'),
    serviceClient.from('reservations').select('id, boat_id, time_slot_id, user_id').eq('date', date).eq('status', 'active'),
    serviceClient.from('blocked_dates').select('boat_id').eq('date', date),
  ])

  const boats = boatsRes.data ?? []
  const slots = slotsRes.data ?? []
  const reservations = reservationsRes.data ?? []
  const blockedBoatIds = new Set((blockedRes.data ?? []).map((b) => b.boat_id))

  // Build availability: for each non-blocked boat, list all slots with availability status
  const availability = boats
    .filter((boat) => !blockedBoatIds.has(boat.id))
    .map((boat) => {
      const boatReservations = reservations.filter((r) => r.boat_id === boat.id)
      const bookedSlotIds = new Set(boatReservations.map((r) => r.time_slot_id))
      const userReservationsBySlot = new Map(
        boatReservations.filter((r) => r.user_id === user.id).map((r) => [r.time_slot_id, r.id])
      )

      return {
        ...boat,
        slots: slots.map((slot) => ({
          ...slot,
          available: !bookedSlotIds.has(slot.id),
          booked_by_you: userReservationsBySlot.has(slot.id),
          reservation_id: userReservationsBySlot.get(slot.id) ?? null,
        })),
      }
    })

  return NextResponse.json({ availability })
}
