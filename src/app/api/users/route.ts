import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createServiceClient()
  const role = request.nextUrl.searchParams.get('role')

  let query = supabase
    .from('users')
    .select('id, first_name, last_name, email, role')
    .eq('is_active', true)
    .order('last_name')

  if (role) {
    query = query.eq('role', role)
  }

  const { data: users } = await query

  return NextResponse.json({ users: users ?? [] })
}
