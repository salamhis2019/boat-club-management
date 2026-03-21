import Link from 'next/link'

type Tab = {
  label: string
  href: string
  count?: number
  active: boolean
}

export function TabSwitcher({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
            tab.active
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
        </Link>
      ))}
    </div>
  )
}
