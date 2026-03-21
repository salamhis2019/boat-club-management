import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Boat Club</h1>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
              <Link href="/dashboard/book" className="text-muted-foreground hover:text-foreground">Book a Boat</Link>
              <Link href="/dashboard/reservations" className="text-muted-foreground hover:text-foreground">My Reservations</Link>
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
