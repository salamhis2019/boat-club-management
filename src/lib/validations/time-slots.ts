import { z } from 'zod'

export const timeSlotSchema = z.object({
  name: z.string().min(1, 'Time slot name is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
})
