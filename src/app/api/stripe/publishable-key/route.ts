import { getPublishableKey } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const publishableKey = await getPublishableKey()
    return NextResponse.json({ publishableKey })
  } catch {
    return NextResponse.json({ publishableKey: '' }, { status: 500 })
  }
}
