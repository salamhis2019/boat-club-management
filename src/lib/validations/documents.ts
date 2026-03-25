import { z } from 'zod'

export const uploadDocumentSchema = z.object({
  type: z.enum(['waiver', 'drivers_license'], { message: 'Document type is required' }),
})
