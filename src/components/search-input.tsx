'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { SearchIcon } from 'lucide-react'

export function SearchInput({
  placeholder = 'Search...',
  baseUrl,
}: {
  placeholder?: string
  baseUrl: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentSearch = searchParams.get('search') ?? ''

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = currentSearch
    }
  }, [currentSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const value = e.target.value.trim()
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
      // Reset to page 1 on new search
      params.delete('page')

      router.replace(`${baseUrl}?${params.toString()}`)
    }, 300)
  }

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        defaultValue={currentSearch}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  )
}
