import { createServiceClient } from '@/lib/supabase/service'
import { UserForm } from '@/components/users/user-form'
import { notFound } from 'next/navigation'
import type { User } from '@/types/database'

export default async function AdminEditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (!user) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <UserForm user={user as User} />
    </div>
  )
}
