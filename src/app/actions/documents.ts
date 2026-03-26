'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROLES } from '@/lib/constants/roles.const'
import { isValidUuid } from '@/lib/validations/common'
import { uploadDocumentSchema } from '@/lib/validations/documents'
import { revalidatePath } from 'next/cache'
import { BUCKETS } from '@/lib/constants/buckets.const'

export type DocumentActionState = {
  error?: string
  success?: string
} | null

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export async function uploadDocument(_prevState: DocumentActionState, formData: FormData): Promise<DocumentActionState> {
  const raw = {
    type: formData.get('type') as string,
  }

  const result = uploadDocumentSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const file = formData.get('file') as File
  if (!file || file.size === 0) {
    return { error: 'Please select a file to upload.' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File must be smaller than 10MB.' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'File must be a JPEG, PNG, WebP image or PDF.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const serviceClient = createServiceClient()

  // Verify user is member or sub_user
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== ROLES.MEMBER) {
    return { error: 'Only members can upload documents.' }
  }

  // Delete existing document of the same type if it exists
  const { data: existing } = await serviceClient
    .from('documents')
    .select('id, file_url')
    .eq('user_id', user.id)
    .eq('type', result.data.type)
    .single()

  if (existing) {
    await serviceClient.storage.from(BUCKETS.USER_DOCUMENTS).remove([existing.file_url])
    await serviceClient.from('documents').delete().eq('id', existing.id)
  }

  // Upload file
  const ext = MIME_TO_EXT[file.type] ?? 'bin'
  const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await serviceClient.storage
    .from(BUCKETS.USER_DOCUMENTS)
    .upload(storagePath, file)

  if (uploadError) {
    return { error: 'Failed to upload file. Please try again.' }
  }

  // Insert document record
  const { error: insertError } = await serviceClient.from('documents').insert({
    user_id: user.id,
    type: result.data.type,
    file_url: storagePath,
    approved: false,
  })

  if (insertError) {
    // Clean up uploaded file
    await serviceClient.storage.from(BUCKETS.USER_DOCUMENTS).remove([storagePath])
    return { error: 'Failed to save document record. Please try again.' }
  }

  // Reset documents_approved since a new unreviewed doc was uploaded
  await serviceClient
    .from('users')
    .update({ documents_approved: false, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  revalidatePath('/dashboard/documents')
  revalidatePath('/admin/documents')
  return { success: 'Document uploaded successfully. It will be reviewed by an admin.' }
}

export async function approveDocument(documentId: string): Promise<{ error?: string }> {
  if (!isValidUuid(documentId)) {
    return { error: 'Invalid document ID.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const serviceClient = createServiceClient()

  // Verify admin
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== ROLES.ADMIN) {
    return { error: 'Only admins can approve documents.' }
  }

  // Get the document
  const { data: doc } = await serviceClient
    .from('documents')
    .select('id, user_id, type')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return { error: 'Document not found.' }
  }

  // Approve the document
  await serviceClient
    .from('documents')
    .update({
      approved: true,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', documentId)

  // Check if all required documents are now approved for this user
  const { count: approvedCount } = await serviceClient
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', doc.user_id)
    .in('type', ['waiver', 'drivers_license'])
    .eq('approved', true)

  if ((approvedCount ?? 0) >= 2) {
    await serviceClient
      .from('users')
      .update({ documents_approved: true, updated_at: new Date().toISOString() })
      .eq('id', doc.user_id)
  }

  revalidatePath('/admin/documents')
  revalidatePath('/dashboard/documents')
  return {}
}

export async function rejectDocument(documentId: string): Promise<{ error?: string }> {
  if (!isValidUuid(documentId)) {
    return { error: 'Invalid document ID.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const serviceClient = createServiceClient()

  // Verify admin
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== ROLES.ADMIN) {
    return { error: 'Only admins can reject documents.' }
  }

  // Get the document
  const { data: doc } = await serviceClient
    .from('documents')
    .select('id, user_id, file_url')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return { error: 'Document not found.' }
  }

  // Delete file from storage
  await serviceClient.storage.from(BUCKETS.USER_DOCUMENTS).remove([doc.file_url])

  // Delete document record
  await serviceClient.from('documents').delete().eq('id', documentId)

  // Set documents_approved to false
  await serviceClient
    .from('users')
    .update({ documents_approved: false, updated_at: new Date().toISOString() })
    .eq('id', doc.user_id)

  revalidatePath('/admin/documents')
  revalidatePath('/dashboard/documents')
  return {}
}
