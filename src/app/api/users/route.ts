import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROLES } from '@/lib/constants/roles.const'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const role = request.nextUrl.searchParams.get('role')

  let query = serviceClient
    .from('users')
    .select('id, first_name, last_name, email, role')
    .eq('is_active', true)
    .order('last_name')

  if (role && Object.values(ROLES).includes(role as typeof ROLES[keyof typeof ROLES])) {
    query = query.eq('role', role)
  }

  const { data: users } = await query

  return NextResponse.json({ users: users ?? [] })
}
