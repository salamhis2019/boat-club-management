import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Get all active boats, time slots, existing reservations, and blocked dates in parallel
  const [boatsRes, slotsRes, reservationsRes, blockedRes] = await Promise.all([
    supabase.from('boats').select('*').eq('is_active', true).order('name'),
    supabase.from('time_slots').select('*').eq('is_active', true).order('start_time'),
    supabase.from('reservations').select('boat_id, time_slot_id').eq('date', date).eq('status', 'active'),
    supabase.from('blocked_dates').select('boat_id').eq('date', date),
  ])

  const boats = boatsRes.data ?? []
  const slots = slotsRes.data ?? []
  const reservations = reservationsRes.data ?? []
  const blockedBoatIds = new Set((blockedRes.data ?? []).map((b) => b.boat_id))

  // Build availability: for each non-blocked boat, list available slots
  const availability = boats
    .filter((boat) => !blockedBoatIds.has(boat.id))
    .map((boat) => {
      const bookedSlotIds = new Set(
        reservations
          .filter((r) => r.boat_id === boat.id)
          .map((r) => r.time_slot_id)
      )
      const availableSlots = slots.filter((slot) => !bookedSlotIds.has(slot.id))

      return {
        ...boat,
        available_slots: availableSlots,
      }
    })
    .filter((boat) => boat.available_slots.length > 0)

  return NextResponse.json({ availability })
}
