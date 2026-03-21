import { createServiceClient } from '@/lib/supabase/service'

type ValidationResult = {
  valid: boolean
  error?: string
}

export async function validateBookingRules(
  userId: string,
  date: string,
  boatId: string,
  timeSlotId: string,
  isAdmin: boolean = false
): Promise<ValidationResult> {
  const supabase = createServiceClient()

  // Rule 5: Within 24 hours → blocked for members
  if (!isAdmin) {
    const bookingDate = new Date(date + 'T00:00:00')
    const now = new Date()
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      return { valid: false, error: 'Cannot book within 24 hours. Please call the club to reserve.' }
    }
  }

  // Rule 6: Documents must be approved (members only)
  if (!isAdmin) {
    const { data: user } = await supabase
      .from('users')
      .select('documents_approved, membership_active')
      .eq('id', userId)
      .single()

    if (!user) {
      return { valid: false, error: 'User not found.' }
    }

    if (!user.documents_approved) {
      return { valid: false, error: 'Your documents must be approved before booking.' }
    }

    // Rule 7: Membership must be active (members only)
    if (!user.membership_active) {
      return { valid: false, error: 'Your membership must be active to book.' }
    }
  }

  // Rule 8: Cannot book blocked dates
  const { data: blockedDate } = await supabase
    .from('blocked_dates')
    .select('id')
    .eq('boat_id', boatId)
    .eq('date', date)
    .maybeSingle()

  if (blockedDate) {
    return { valid: false, error: 'This boat is not available on the selected date.' }
  }

  // Get user's active reservations for rule checks
  const { data: activeReservations } = await supabase
    .from('reservations')
    .select('id, date, boat_id, time_slot_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  const reservations = activeReservations ?? []

  // Rule 1: Max 2 active reservations
  if (reservations.length >= 2) {
    return { valid: false, error: 'You already have 2 active reservations. Cancel one to book another.' }
  }

  // Rule 2: Max 1 reservation per weekend
  const bookingDay = new Date(date + 'T00:00:00').getDay()
  const isWeekend = bookingDay === 0 || bookingDay === 6
  if (isWeekend) {
    const hasWeekendBooking = reservations.some((r) => {
      const day = new Date(r.date + 'T00:00:00').getDay()
      return day === 0 || day === 6
    })
    if (hasWeekendBooking) {
      return { valid: false, error: 'You can only have 1 weekend reservation at a time.' }
    }
  }

  // Rule 3: No overlapping reservations (same user, same date, same slot)
  const hasOverlap = reservations.some(
    (r) => r.date === date && r.time_slot_id === timeSlotId
  )
  if (hasOverlap) {
    return { valid: false, error: 'You already have a reservation at this time.' }
  }

  // Rule 4: Cannot book both slots on same boat same day
  const hasSameBoatSameDay = reservations.some(
    (r) => r.date === date && r.boat_id === boatId
  )
  if (hasSameBoatSameDay) {
    return { valid: false, error: 'You cannot book the same boat for both time slots on the same day.' }
  }

  return { valid: true }
}
