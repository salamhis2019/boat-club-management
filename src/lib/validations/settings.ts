import { z } from 'zod'

export const stripeKeysSchema = z.object({
  publishable_key: z
    .string()
    .min(1, 'Publishable key is required')
    .startsWith('pk_', 'Publishable key must start with pk_'),
  secret_key: z
    .string()
    .min(1, 'Secret key is required')
    .startsWith('sk_', 'Secret key must start with sk_'),
  webhook_secret: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z.union([
        z.literal(''),
        z.string().startsWith('whsec_', 'Webhook secret must start with whsec_'),
      ])
    ),
})
