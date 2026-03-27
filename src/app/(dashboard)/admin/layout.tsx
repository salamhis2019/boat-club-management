import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { Sidebar } from '@/components/sidebar'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROLES } from '@/lib/constants/roles.const'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== ROLES.ADMIN) redirect('/dashboard')

  return (
    <Sidebar title="Boat Club Admin" variant="admin" logoutAction={logout}>
      {children}
    </Sidebar>
  )
}
