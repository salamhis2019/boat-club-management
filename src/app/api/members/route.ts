import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceClient()

  const { data: members } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .in('role', ['member', 'sub_user'])
    .eq('is_active', true)
    .order('last_name')

  return NextResponse.json({ members: members ?? [] })
}
