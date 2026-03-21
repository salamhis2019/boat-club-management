import { z } from 'zod'

export const boatSchema = z.object({
  name: z.string().min(1, 'Boat name is required'),
  description: z.string().optional().default(''),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  horsepower: z.string().optional().default(''),
  features: z.string().optional().default(''),
  supported_activities: z.string().optional().default(''),
})
