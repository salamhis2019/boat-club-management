import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { BUCKETS } from '@/lib/constants/buckets.const'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // Get user role
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Get document
  const { data: doc } = await serviceClient
    .from('documents')
    .select('id, user_id, file_url')
    .eq('id', id)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Only admin or the document owner can view
  if (profile?.role !== 'admin' && doc.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Generate signed URL (5-minute expiry)
  const { data: signedUrl, error } = await serviceClient.storage
    .from(BUCKETS.USER_DOCUMENTS)
    .createSignedUrl(doc.file_url, 300)

  if (error || !signedUrl) {
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl.signedUrl })
}
