import { z } from 'zod'

export const reservationSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  boat_id: z.string().uuid('Invalid boat'),
  time_slot_id: z.string().uuid('Invalid time slot'),
})

export const reservationOnBehalfSchema = reservationSchema.extend({
  user_id: z.string().uuid('Invalid user'),
})
