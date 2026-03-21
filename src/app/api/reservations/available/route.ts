import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const userId = searchParams.get('user_id')

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Get all active boats, time slots, existing reservations, and blocked dates in parallel
  const [boatsRes, slotsRes, reservationsRes, blockedRes] = await Promise.all([
    supabase.from('boats').select('*').eq('is_active', true).order('name'),
    supabase.from('time_slots').select('*').eq('is_active', true).order('start_time'),
    supabase.from('reservations').select('id, boat_id, time_slot_id, user_id').eq('date', date).eq('status', 'active'),
    supabase.from('blocked_dates').select('boat_id').eq('date', date),
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
        boatReservations.filter((r) => r.user_id === userId).map((r) => [r.time_slot_id, r.id])
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
