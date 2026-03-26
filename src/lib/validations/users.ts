import { z } from 'zod'
import { ROLES } from '@/lib/constants/roles.const'

export const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().optional().default(''),
  role: z.enum([ROLES.ADMIN, ROLES.MEMBER], { message: 'Role is required' }),
  membership_type: z.enum(['monthly', 'annual'], { message: 'Membership type is required' }),
  password: z.string().min(7, 'Password must be at least 7 characters'),
})

export const updateUserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Please enter a valid email address').optional(),
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  phone_number: z.string().optional(),
  role: z.enum([ROLES.ADMIN, ROLES.MEMBER]).optional(),
  membership_type: z.enum(['monthly', 'annual']).optional(),
  membership_active: z.coerce.boolean().optional(),
})

