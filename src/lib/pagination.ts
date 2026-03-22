export const PAGE_SIZE = 15

export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function parsePage(params: { page?: string }): number {
  const raw = Number(params.page)
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1
}

export function paginationRange(page: number, pageSize: number = PAGE_SIZE) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}

export function buildPaginationMeta(
  page: number,
  total: number,
  pageSize: number = PAGE_SIZE
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}
