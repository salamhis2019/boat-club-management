import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Simple query to verify database connection
    const { error } = await supabase.from('boats').select('id').limit(1)

    if (error) {
      return NextResponse.json(
        { status: 'error', message: 'Database connection failed' },
        { status: 503 }
      )
    }

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
