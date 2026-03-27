import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isValidUuid } from '@/lib/validations/common'
import { NextRequest, NextResponse } from 'next/server'
import { BUCKETS } from '@/lib/constants/buckets.const'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: 'Invalid rule ID' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // Get club rule
  const { data: rule } = await serviceClient
    .from('club_rules')
    .select('id, file_url')
    .eq('id', id)
    .single()

  if (!rule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
  }

  // Generate signed URL (5-minute expiry)
  const { data: signedUrl, error } = await serviceClient.storage
    .from(BUCKETS.CLUB_RULES)
    .createSignedUrl(rule.file_url, 300)

  if (error || !signedUrl) {
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl.signedUrl })
}
