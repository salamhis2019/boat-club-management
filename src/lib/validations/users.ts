import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().optional().default(''),
  role: z.enum(['admin', 'member'], { message: 'Role is required' }),
  membership_type: z.enum(['monthly', 'annual'], { message: 'Membership type is required' }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const updateUserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Please enter a valid email address').optional(),
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  phone_number: z.string().optional(),
  role: z.enum(['admin', 'member']).optional(),
  membership_type: z.enum(['monthly', 'annual']).optional(),
  membership_active: z.coerce.boolean().optional(),
})

