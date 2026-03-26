import { z } from 'zod'

export const uuidSchema = z.string().uuid('Invalid ID format')

export function isValidUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success
}
