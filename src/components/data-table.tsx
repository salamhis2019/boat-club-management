import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/pagination'
import type { PaginationMeta } from '@/lib/pagination'

export type Column<T> = {
  header: string
  className?: string
  cell: (row: T) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  pagination?: PaginationMeta
  baseUrl?: string
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No results.',
  pagination,
  baseUrl,
}: DataTableProps<T>) {
  const actionsCol =
    columns.length > 0 &&
    columns[columns.length - 1].header.toLowerCase() === 'actions'
      ? columns[columns.length - 1]
      : null
  const contentCols = actionsCol ? columns.slice(0, -1) : columns
  const headerCols = contentCols.slice(0, 2)
  const detailCols = contentCols.slice(2)

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {data.length > 0 ? (
          data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="rounded-lg border bg-card px-3 py-2.5"
            >
              {/* Card header: first two columns */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 text-sm font-medium">
                  {headerCols[0]?.cell(row)}
                </div>
                {headerCols[1] && (
                  <div className="shrink-0 text-xs">
                    {headerCols[1].cell(row)}
                  </div>
                )}
              </div>

              {/* Detail rows: flowing inline layout */}
              {detailCols.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-1.5 text-xs">
                  {detailCols.map((col, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <span className="text-muted-foreground">
                        {col.header}:
                      </span>
                      {col.cell(row)}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions row */}
              {actionsCol && (
                <div className="mt-1.5 flex justify-end border-t pt-1.5">
                  {actionsCol.cell(row)}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </div>

      {pagination && baseUrl && (
        <Pagination pagination={pagination} baseUrl={baseUrl} />
      )}
    </div>
  )
}
