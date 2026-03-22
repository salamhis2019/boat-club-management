'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { PaginationMeta } from '@/lib/pagination'

type PaginationProps = {
  pagination: PaginationMeta
  baseUrl: string
}

function buildPageUrl(baseUrl: string, page: number): string {
  const url = new URL(baseUrl, 'http://localhost')
  url.searchParams.set('page', String(page))
  return url.pathname + url.search
}

export function Pagination({ pagination, baseUrl }: PaginationProps) {
  const { page, pageSize, total, totalPages } = pagination

  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        {hasPrev ? (
          <Button variant="outline" size="icon-sm" asChild>
            <Link href={buildPageUrl(baseUrl, page - 1)}>
              <ChevronLeftIcon className="size-4" />
              <span className="sr-only">Previous page</span>
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon-sm" disabled>
            <ChevronLeftIcon className="size-4" />
            <span className="sr-only">Previous page</span>
          </Button>
        )}
        {hasNext ? (
          <Button variant="outline" size="icon-sm" asChild>
            <Link href={buildPageUrl(baseUrl, page + 1)}>
              <ChevronRightIcon className="size-4" />
              <span className="sr-only">Next page</span>
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon-sm" disabled>
            <ChevronRightIcon className="size-4" />
            <span className="sr-only">Next page</span>
          </Button>
        )}
      </div>
    </div>
  )
}
