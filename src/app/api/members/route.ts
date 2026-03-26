import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROLES } from '@/lib/constants/roles.const'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // Only admins and members can list members
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: members } = await serviceClient
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('role', ROLES.MEMBER)
    .eq('is_active', true)
    .order('last_name')

  return NextResponse.json({ members: members ?? [] })
}
