import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite]',
        'before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent',
        'dark:before:via-white/10',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
