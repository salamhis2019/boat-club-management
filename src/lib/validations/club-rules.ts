import { z } from 'zod'

export const uploadClubRuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  setActive: z.coerce.boolean().default(false),
})

export const signClubRuleSchema = z.object({
  club_rule_id: z.string().uuid('Invalid rule ID'),
})
