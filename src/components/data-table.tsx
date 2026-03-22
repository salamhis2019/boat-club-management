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
  return (
    <div>
      <div className="overflow-x-auto">
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
      {pagination && baseUrl && (
        <Pagination pagination={pagination} baseUrl={baseUrl} />
      )}
    </div>
  )
}
