import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(7, 'Password must be at least 7 characters'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const updatePasswordSchema = z
  .object({
    password: z.string().min(7, 'Password must be at least 7 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
