import { getPublishableKey } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const publishableKey = await getPublishableKey()
    return NextResponse.json({ publishableKey })
  } catch {
    return NextResponse.json({ publishableKey: '' }, { status: 500 })
  }
}
