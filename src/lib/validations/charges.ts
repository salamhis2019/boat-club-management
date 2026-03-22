import { z } from 'zod'

export const createChargeSchema = z.object({
  user_id: z.string().uuid('Invalid user'),
  amount: z.coerce.number().min(0.5, 'Minimum charge is $0.50'),
  type: z.enum(['gas', 'misc'], { message: 'Charge type is required' }),
  description: z.string().min(1, 'Description is required'),
  reservation_id: z.string().uuid().nullish().or(z.literal('')),
})

export const retryChargeSchema = z.object({
  charge_id: z.string().uuid('Invalid charge'),
})
