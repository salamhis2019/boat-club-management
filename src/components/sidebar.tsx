'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  MenuIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  ShipIcon,
  ClockIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  DollarSignIcon,
  CreditCardIcon,
  UsersIcon,
  FileTextIcon,
  SettingsIcon,
  ScrollTextIcon,
  type LucideIcon,
} from 'lucide-react'

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
}

const adminLinks: NavLink[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/admin/boats', label: 'Boats', icon: ShipIcon },
  { href: '/admin/time-slots', label: 'Time Slots', icon: ClockIcon },
  { href: '/admin/reservations', label: 'Reservations', icon: CalendarDaysIcon },
  { href: '/admin/charges', label: 'Charges', icon: DollarSignIcon },
  { href: '/admin/documents', label: 'Documents', icon: FileTextIcon },
  { href: '/admin/club-rules', label: 'Club Rules', icon: ScrollTextIcon },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

const memberLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/dashboard/book', label: 'Book a Boat', icon: BookOpenIcon },
  { href: '/dashboard/reservations', label: 'My Reservations', icon: CalendarDaysIcon },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCardIcon },
  { href: '/dashboard/documents', label: 'Documents', icon: FileTextIcon },
  { href: '/dashboard/club-rules', label: 'Club Rules', icon: ScrollTextIcon },
]

type SidebarProps = {
  title: string
  variant: 'admin' | 'member'
  logoutAction: () => void
  children: React.ReactNode
}

function NavLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: NavLink[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar({ title, variant, logoutAction, children }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const links = variant === 'admin' ? adminLinks : memberLinks

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="mr-2" />
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks links={links} pathname={pathname} />
        </div>
        <div className="border-t p-3">
          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <LogOutIcon className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MenuIcon className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" showCloseButton={false} className="w-64 p-0">
            <SheetHeader className="border-b">
              <SheetTitle className="flex items-center gap-2">
                <Image src="/logo.png" alt="Logo" width={28} height={28} />
                {title}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks
                links={links}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <div className="border-t p-3">
              <form action={logoutAction}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                >
                  <LogOutIcon className="size-4" />
                  Sign out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
        <Image src="/logo.png" alt="Logo" width={28} height={28} />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </header>

      {/* Main content */}
      <main className="md:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
