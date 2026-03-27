'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROLES } from '@/lib/constants/roles.const'
import { isValidUuid } from '@/lib/validations/common'
import { uploadClubRuleSchema, signClubRuleSchema } from '@/lib/validations/club-rules'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { BUCKETS } from '@/lib/constants/buckets.const'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export type ClubRuleActionState = {
  error?: string
  success?: string
} | null

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== ROLES.ADMIN) return null
  return user
}

export async function uploadClubRule(
  _prevState: ClubRuleActionState,
  formData: FormData
): Promise<ClubRuleActionState> {
  const raw = {
    title: formData.get('title') as string,
    setActive: formData.get('setActive') as string,
  }

  const result = uploadClubRuleSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const admin = await requireAdmin()
  if (!admin) {
    return { error: 'Only admins can upload club rules.' }
  }

  const file = formData.get('file') as File
  if (!file || file.size === 0) {
    return { error: 'Please select a PDF file to upload.' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'File must be smaller than 10MB.' }
  }

  if (file.type !== 'application/pdf') {
    return { error: 'Only PDF files are allowed.' }
  }

  const serviceClient = createServiceClient()

  // Get next version number
  const { count } = await serviceClient
    .from('club_rules')
    .select('*', { count: 'exact', head: true })

  const version = (count ?? 0) + 1

  // Upload file
  const storagePath = `rules/${crypto.randomUUID()}.pdf`
  const { error: uploadError } = await serviceClient.storage
    .from(BUCKETS.CLUB_RULES)
    .upload(storagePath, file)

  if (uploadError) {
    return { error: 'Failed to upload file. Please try again.' }
  }

  // If setting as active, deactivate all others first
  if (result.data.setActive) {
    await serviceClient
      .from('club_rules')
      .update({ is_active: false })
      .eq('is_active', true)
  }

  // Insert club rule record
  const { error: insertError } = await serviceClient.from('club_rules').insert({
    title: result.data.title,
    file_url: storagePath,
    version,
    is_active: result.data.setActive,
    uploaded_by: admin.id,
  })

  if (insertError) {
    await serviceClient.storage.from(BUCKETS.CLUB_RULES).remove([storagePath])
    return { error: 'Failed to save rule record. Please try again.' }
  }

  // If set as active, reset rules_accepted for all members who haven't signed this version
  if (result.data.setActive) {
    await serviceClient
      .from('users')
      .update({ rules_accepted: false, updated_at: new Date().toISOString() })
      .eq('role', ROLES.MEMBER)
  }

  revalidatePath('/admin/club-rules')
  redirect('/admin/club-rules')
}

export async function setActiveRule(ruleId: string): Promise<{ error?: string }> {
  if (!isValidUuid(ruleId)) {
    return { error: 'Invalid rule ID.' }
  }

  const admin = await requireAdmin()
  if (!admin) {
    return { error: 'Only admins can manage club rules.' }
  }

  const serviceClient = createServiceClient()

  // Verify rule exists
  const { data: rule } = await serviceClient
    .from('club_rules')
    .select('id')
    .eq('id', ruleId)
    .single()

  if (!rule) {
    return { error: 'Rule not found.' }
  }

  // Deactivate all rules
  await serviceClient
    .from('club_rules')
    .update({ is_active: false })
    .eq('is_active', true)

  // Activate the selected rule
  await serviceClient
    .from('club_rules')
    .update({ is_active: true })
    .eq('id', ruleId)

  // Reset rules_accepted for all members
  await serviceClient
    .from('users')
    .update({ rules_accepted: false, updated_at: new Date().toISOString() })
    .eq('role', ROLES.MEMBER)

  revalidatePath('/admin/club-rules')
  revalidatePath('/dashboard/club-rules')
  return {}
}

export async function deleteClubRule(ruleId: string): Promise<{ error?: string }> {
  if (!isValidUuid(ruleId)) {
    return { error: 'Invalid rule ID.' }
  }

  const admin = await requireAdmin()
  if (!admin) {
    return { error: 'Only admins can delete club rules.' }
  }

  const serviceClient = createServiceClient()

  const { data: rule } = await serviceClient
    .from('club_rules')
    .select('id, file_url, is_active')
    .eq('id', ruleId)
    .single()

  if (!rule) {
    return { error: 'Rule not found.' }
  }

  if (rule.is_active) {
    return { error: 'Cannot delete the active rule. Set another rule as active first.' }
  }

  // Delete signatures and their signed PDFs from storage
  const { data: signatures } = await serviceClient
    .from('club_rule_signatures')
    .select('signature_url')
    .eq('club_rule_id', ruleId)

  if (signatures && signatures.length > 0) {
    const signedPdfPaths = signatures.map((s) => s.signature_url)
    await serviceClient.storage.from(BUCKETS.CLUB_RULES).remove(signedPdfPaths)
  }

  await serviceClient
    .from('club_rule_signatures')
    .delete()
    .eq('club_rule_id', ruleId)

  // Delete file from storage
  await serviceClient.storage.from(BUCKETS.CLUB_RULES).remove([rule.file_url])

  // Delete rule record
  await serviceClient.from('club_rules').delete().eq('id', ruleId)

  revalidatePath('/admin/club-rules')
  return {}
}

export async function signClubRule(
  _prevState: ClubRuleActionState,
  formData: FormData
): Promise<ClubRuleActionState> {
  const raw = {
    club_rule_id: formData.get('club_rule_id') as string,
  }

  const result = signClubRuleSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const signatureData = formData.get('signature') as string
  if (!signatureData) {
    return { error: 'Please provide your signature.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const serviceClient = createServiceClient()

  // Verify user is a member and get their name
  const { data: profile } = await serviceClient
    .from('users')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== ROLES.MEMBER) {
    return { error: 'Only members can sign club rules.' }
  }

  // Verify the rule exists and is active
  const { data: rule } = await serviceClient
    .from('club_rules')
    .select('id, file_url')
    .eq('id', result.data.club_rule_id)
    .eq('is_active', true)
    .single()

  if (!rule) {
    return { error: 'This rule is no longer active.' }
  }

  // Check if already signed
  const { data: existing } = await serviceClient
    .from('club_rule_signatures')
    .select('id')
    .eq('user_id', user.id)
    .eq('club_rule_id', result.data.club_rule_id)
    .maybeSingle()

  if (existing) {
    return { error: 'You have already signed these rules.' }
  }

  // Convert base64 signature to buffer
  const base64Match = signatureData.match(/^data:image\/png;base64,(.+)$/)
  if (!base64Match) {
    return { error: 'Invalid signature format.' }
  }

  const sigBuffer = Buffer.from(base64Match[1], 'base64')

  // Download the original PDF
  const { data: pdfData, error: downloadError } = await serviceClient.storage
    .from(BUCKETS.CLUB_RULES)
    .download(rule.file_url)

  if (downloadError || !pdfData) {
    return { error: 'Failed to load the rules document.' }
  }

  // Overlay signature onto the last page of the PDF
  const pdfBytes = new Uint8Array(await pdfData.arrayBuffer())
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const sigImage = await pdfDoc.embedPng(sigBuffer)

  const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1]
  const { width: pageWidth } = lastPage.getSize()

  // Scale signature to reasonable size (max 200px wide)
  const sigDims = sigImage.scale(Math.min(200 / sigImage.width, 1))

  // Draw signature at bottom-left area of last page
  const sigX = 50
  const sigY = 60
  lastPage.drawImage(sigImage, {
    x: sigX,
    y: sigY,
    width: sigDims.width,
    height: sigDims.height,
  })

  // Draw name and date text below signature
  const signedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const sigText = `Signed by: ${profile.first_name} ${profile.last_name}  |  Date: ${signedDate}`

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  lastPage.drawText(sigText, {
    x: sigX,
    y: sigY - 15,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
  })

  // Draw a subtle line above the signature block
  lastPage.drawLine({
    start: { x: sigX, y: sigY + sigDims.height + 8 },
    end: { x: Math.min(sigX + 250, pageWidth - 50), y: sigY + sigDims.height + 8 },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  })

  const signedPdfBytes = await pdfDoc.save()

  // Upload the signed PDF
  const signedPdfPath = `signed/${user.id}/${result.data.club_rule_id}.pdf`
  const { error: uploadError } = await serviceClient.storage
    .from(BUCKETS.CLUB_RULES)
    .upload(signedPdfPath, signedPdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    return { error: 'Failed to save signed document. Please try again.' }
  }

  // Create signature record with signed PDF path
  const { error: insertError } = await serviceClient
    .from('club_rule_signatures')
    .insert({
      user_id: user.id,
      club_rule_id: result.data.club_rule_id,
      signature_url: signedPdfPath,
    })

  if (insertError) {
    await serviceClient.storage.from(BUCKETS.CLUB_RULES).remove([signedPdfPath])
    return { error: 'Failed to record signature. Please try again.' }
  }

  // Set rules_accepted to true
  await serviceClient
    .from('users')
    .update({ rules_accepted: true, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  revalidatePath('/dashboard/club-rules')
  revalidatePath('/dashboard/book')
  revalidatePath('/dashboard')
  revalidatePath('/admin/club-rules')
  return { success: 'Club rules signed successfully!' }
}
