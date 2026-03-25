'use server'

import { createServiceClient } from '@/lib/supabase/service'
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

async function uploadImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null

  const supabase = createServiceClient()
  const ext = file.name.split('.').pop()
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
  const id = formData.get('id') as string
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
