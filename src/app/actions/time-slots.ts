'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { timeSlotSchema } from '@/lib/validations/time-slots'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type TimeSlotActionState = {
  error?: string
} | null

export async function createTimeSlot(_prevState: TimeSlotActionState, formData: FormData): Promise<TimeSlotActionState> {
  const raw = {
    name: formData.get('name') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
  }

  const result = timeSlotSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('time_slots').insert({
    name: result.data.name,
    start_time: result.data.start_time,
    end_time: result.data.end_time,
  })

  if (error) {
    return { error: 'Failed to create time slot. Please try again.' }
  }

  redirect('/admin/time-slots')
}

export async function toggleTimeSlotActive(id: string): Promise<void> {
  const supabase = createServiceClient()

  const { data: slot } = await supabase
    .from('time_slots')
    .select('is_active')
    .eq('id', id)
    .single()

  if (!slot) return

  await supabase
    .from('time_slots')
    .update({ is_active: !slot.is_active })
    .eq('id', id)

  revalidatePath('/admin/time-slots')
}

export async function deleteTimeSlot(id: string): Promise<void> {
  const supabase = createServiceClient()

  await supabase
    .from('time_slots')
    .delete()
    .eq('id', id)

  revalidatePath('/admin/time-slots')
}
