import { logout } from '@/app/actions/auth'
import { Sidebar } from '@/components/sidebar'

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Sidebar title="Boat Club" variant="member" logoutAction={logout}>
      {children}
    </Sidebar>
  )
}
