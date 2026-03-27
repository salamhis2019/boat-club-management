import { Badge } from '@/components/ui/badge'

type RuleStatusBadgeProps = {
  variant: 'active' | 'inactive' | 'signed' | 'not_signed'
}

const config = {
  active: { label: 'Active', className: 'bg-green-600 text-white hover:bg-green-600' },
  inactive: { label: 'Inactive', className: '' },
  signed: { label: 'Signed', className: 'bg-green-600 text-white hover:bg-green-600' },
  not_signed: { label: 'Not Signed', className: 'bg-amber-500 text-white hover:bg-amber-500' },
} as const

export function RuleStatusBadge({ variant }: RuleStatusBadgeProps) {
  const { label, className } = config[variant]
  return (
    <Badge variant={className ? 'default' : 'secondary'} className={className}>
      {label}
    </Badge>
  )
}
