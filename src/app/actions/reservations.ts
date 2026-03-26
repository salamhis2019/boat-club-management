'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROLES } from '@/lib/constants/roles.const'
import { isValidUuid } from '@/lib/validations/common'
import { reservationSchema, reservationOnBehalfSchema } from '@/lib/validations/reservations'
import { validateBookingRules } from '@/lib/reservations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ReservationActionState = {
  error?: string
} | null

export async function createReservation(_prevState: ReservationActionState, formData: FormData): Promise<ReservationActionState> {
  const raw = {
    date: formData.get('date') as string,
    boat_id: formData.get('boat_id') as string,
    time_slot_id: formData.get('time_slot_id') as string,
  }

  const result = reservationSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  // Get current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to book.' }
  }

  // Validate booking rules
  const validation = await validateBookingRules(
    user.id,
    result.data.date,
    result.data.boat_id,
    result.data.time_slot_id,
    false
  )

  if (!validation.valid) {
    return { error: validation.error }
  }

  // Create reservation
  const serviceClient = createServiceClient()
  const { error } = await serviceClient.from('reservations').insert({
    user_id: user.id,
    boat_id: result.data.boat_id,
    date: result.data.date,
    time_slot_id: result.data.time_slot_id,
    created_by: user.id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This slot is already booked. Please choose another.' }
    }
    return { error: 'Failed to create reservation. Please try again.' }
  }

  redirect('/dashboard/reservations')
}

export async function createReservationOnBehalf(_prevState: ReservationActionState, formData: FormData): Promise<ReservationActionState> {
  const raw = {
    user_id: formData.get('user_id') as string,
    date: formData.get('date') as string,
    boat_id: formData.get('boat_id') as string,
    time_slot_id: formData.get('time_slot_id') as string,
  }

  const result = reservationOnBehalfSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  // Get current admin user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  // Verify caller is an admin
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== ROLES.ADMIN) {
    return { error: 'Only admins can book on behalf of members.' }
  }

  // Validate booking rules (admin bypass for 24h/docs/membership)
  const validation = await validateBookingRules(
    result.data.user_id,
    result.data.date,
    result.data.boat_id,
    result.data.time_slot_id,
    true
  )

  if (!validation.valid) {
    return { error: validation.error }
  }

  // Create reservation
  const { error } = await serviceClient.from('reservations').insert({
    user_id: result.data.user_id,
    boat_id: result.data.boat_id,
    date: result.data.date,
    time_slot_id: result.data.time_slot_id,
    created_by: user.id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This slot is already booked. Please choose another.' }
    }
    return { error: 'Failed to create reservation. Please try again.' }
  }

  redirect('/admin/reservations')
}

export async function cancelReservation(id: string): Promise<void> {
  if (!isValidUuid(id)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const serviceClient = createServiceClient()

  // Check if user is admin
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === ROLES.ADMIN

  // Only allow cancelling active reservations
  let query = serviceClient
    .from('reservations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'active')

  // Non-admins can only cancel their own reservations
  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  await query

  revalidatePath('/admin/reservations')
  revalidatePath('/dashboard/reservations')
}
