import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { AlertTriangleIcon } from 'lucide-react'
import Link from 'next/link'

export default async function MemberDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('rules_accepted, documents_approved')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>

      {!profile?.documents_approved && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
          <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Documents required</p>
            <p className="text-sm text-amber-700">
              Upload and get your <Link href="/dashboard/documents" className="underline">documents</Link> approved to start booking reservations.
            </p>
          </div>
        </div>
      )}

      {!profile?.rules_accepted && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
          <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Club rules signature required</p>
            <p className="text-sm text-amber-700">
              You must <Link href="/dashboard/club-rules" className="underline">sign the club rules</Link> before you can book a reservation.
            </p>
          </div>
        </div>
      )}

      <p className="text-muted-foreground">
        Welcome to your dashboard. Use the sidebar to navigate.
      </p>
    </div>
  )
}

