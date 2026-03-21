import { logout } from '@/app/actions/auth'
import { Sidebar } from '@/components/sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Sidebar title="Boat Club Admin" variant="admin" logoutAction={logout}>
      {children}
    </Sidebar>
  )
}
