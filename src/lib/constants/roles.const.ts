import type { UserRole } from '@/types/database'

export const ROLES: Record<Uppercase<UserRole>, UserRole> = {
  ADMIN: 'admin',
  MEMBER: 'member',
  SUB_USER: 'sub_user',
} as const
