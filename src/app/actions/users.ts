'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/supabase/auth'
import { isValidUuid } from '@/lib/validations/common'
import { createUserSchema, updateUserSchema } from '@/lib/validations/users'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type UserActionState = {
  error?: string
  success?: string
} | null

export async function createUser(_prevState: UserActionState, formData: FormData): Promise<UserActionState> {
  const raw = {
    email: formData.get('email') as string,
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    phone_number: formData.get('phone_number') as string,
    role: formData.get('role') as string,
    membership_type: formData.get('membership_type') as string,
    password: formData.get('password') as string,
  }

  const result = createUserSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await requireAdmin()
  } catch {
    return { error: 'Only admins can create users.' }
  }

  const serviceClient = createServiceClient()

  // Create auth account
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: result.data.email,
    password: result.data.password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Failed to create user account.' }
  }

  // Insert profile row
  const { error: insertError } = await serviceClient.from('users').insert({
    id: authData.user.id,
    email: result.data.email,
    first_name: result.data.first_name,
    last_name: result.data.last_name,
    phone_number: result.data.phone_number || '',
    role: result.data.role,
    membership_type: result.data.membership_type,
    membership_active: true,
    documents_approved: false,
    is_active: true,
  })

  if (insertError) {
    // Rollback: delete the auth account
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    return { error: 'Failed to create user profile. Please try again.' }
  }

  redirect('/admin/users')
}

export async function updateUser(_prevState: UserActionState, formData: FormData): Promise<UserActionState> {
  const raw = {
    id: formData.get('id') as string,
    email: formData.get('email') as string,
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    phone_number: formData.get('phone_number') as string,
    role: formData.get('role') as string,
    membership_type: formData.get('membership_type') as string,
    membership_active: formData.get('membership_active') as string,
  }

  const result = updateUserSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await requireAdmin()
  } catch {
    return { error: 'Only admins can update users.' }
  }

  const serviceClient = createServiceClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (result.data.first_name) updateData.first_name = result.data.first_name
  if (result.data.last_name) updateData.last_name = result.data.last_name
  if (result.data.phone_number !== undefined) updateData.phone_number = result.data.phone_number
  if (result.data.role) updateData.role = result.data.role
  if (result.data.membership_type) updateData.membership_type = result.data.membership_type
  if (result.data.membership_active !== undefined) updateData.membership_active = result.data.membership_active

  // Update email in auth if changed
  if (result.data.email) {
    const { error: authEmailError } = await serviceClient.auth.admin.updateUserById(result.data.id, {
      email: result.data.email,
    })
    if (authEmailError) {
      return { error: `Failed to update email: ${authEmailError.message}` }
    }
    updateData.email = result.data.email
  }

  const { error } = await serviceClient
    .from('users')
    .update(updateData)
    .eq('id', result.data.id)

  if (error) {
    return { error: 'Failed to update user. Please try again.' }
  }

  redirect('/admin/users')
}

export async function toggleUserActive(id: string): Promise<void> {
  if (!isValidUuid(id)) return

  try {
    await requireAdmin()
  } catch {
    return
  }

  const serviceClient = createServiceClient()

  const { data: user } = await serviceClient
    .from('users')
    .select('is_active')
    .eq('id', id)
    .single()

  if (!user) return

  await serviceClient
    .from('users')
    .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/users')
}

