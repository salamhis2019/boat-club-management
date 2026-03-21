import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Boat Club Admin</h1>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
              <Link href="/admin/boats" className="text-muted-foreground hover:text-foreground">Boats</Link>
              <Link href="/admin/time-slots" className="text-muted-foreground hover:text-foreground">Time Slots</Link>
              <Link href="/admin/reservations" className="text-muted-foreground hover:text-foreground">Reservations</Link>
            </nav>
          </div>
          <form action={logout}>
            <Button variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
