'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/supabase/auth'
import { isValidUuid } from '@/lib/validations/common'
import { boatSchema } from '@/lib/validations/boats'
import { revalidatePath } from 'next/cache'
import { BUCKETS } from '@/lib/constants/buckets.const'
import { redirect } from 'next/navigation'

export type BoatActionState = {
  error?: string
  success?: string
} | null

function parseArrayField(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

async function uploadImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image must be smaller than 5MB')
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Image must be a JPEG, PNG, or WebP file')
  }

  const supabase = createServiceClient()
  const ext = MIME_TO_EXT[file.type] ?? 'bin'
  const fileName = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKETS.BOAT_IMAGES)
    .upload(fileName, file)

  if (error) {
    throw new Error('Failed to upload image')
  }

  const { data } = supabase.storage
    .from(BUCKETS.BOAT_IMAGES)
    .getPublicUrl(fileName)

  return data.publicUrl
}

export async function createBoat(_prevState: BoatActionState, formData: FormData): Promise<BoatActionState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Only admins can manage boats.' }
  }

  const raw = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    capacity: formData.get('capacity') as string,
    horsepower: formData.get('horsepower') as string,
    features: formData.get('features') as string,
    supported_activities: formData.get('supported_activities') as string,
  }

  const result = boatSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  let imageUrl: string | null = null
  const imageFile = formData.get('image') as File
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImage(imageFile)
    } catch {
      return { error: 'Failed to upload image. Please try again.' }
    }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('boats').insert({
    name: result.data.name,
    description: result.data.description || null,
    capacity: result.data.capacity,
    horsepower: result.data.horsepower || null,
    features: parseArrayField(result.data.features || ''),
    supported_activities: parseArrayField(result.data.supported_activities || ''),
    image_url: imageUrl,
  })

  if (error) {
    return { error: 'Failed to create boat. Please try again.' }
  }

  redirect('/admin/boats')
}

export async function updateBoat(_prevState: BoatActionState, formData: FormData): Promise<BoatActionState> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Only admins can manage boats.' }
  }

  const id = formData.get('id') as string
  if (!isValidUuid(id)) {
    return { error: 'Invalid boat ID.' }
  }

  const raw = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    capacity: formData.get('capacity') as string,
    horsepower: formData.get('horsepower') as string,
    features: formData.get('features') as string,
    supported_activities: formData.get('supported_activities') as string,
  }

  const result = boatSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  let imageUrl: string | undefined
  const imageFile = formData.get('image') as File
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = (await uploadImage(imageFile)) ?? undefined
    } catch {
      return { error: 'Failed to upload image. Please try again.' }
    }
  }

  const supabase = createServiceClient()
  const updateData: Record<string, unknown> = {
    name: result.data.name,
    description: result.data.description || null,
    capacity: result.data.capacity,
    horsepower: result.data.horsepower || null,
    features: parseArrayField(result.data.features || ''),
    supported_activities: parseArrayField(result.data.supported_activities || ''),
  }

  if (imageUrl) {
    updateData.image_url = imageUrl
  }

  const { error } = await supabase
    .from('boats')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: 'Failed to update boat. Please try again.' }
  }

  redirect('/admin/boats')
}

export async function toggleBoatActive(id: string): Promise<void> {
  if (!isValidUuid(id)) return

  try {
    await requireAdmin()
  } catch {
    return
  }

  const supabase = createServiceClient()

  const { data: boat } = await supabase
    .from('boats')
    .select('is_active')
    .eq('id', id)
    .single()

  if (!boat) return

  await supabase
    .from('boats')
    .update({ is_active: !boat.is_active })
    .eq('id', id)

  revalidatePath('/admin/boats')
}
