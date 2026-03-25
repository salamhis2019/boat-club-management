'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EyeIcon, Loader2Icon } from 'lucide-react'

export function DocumentPreviewButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/url`)
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2Icon className="size-4 animate-spin" /> : <EyeIcon className="mr-1 size-4" />}
      View
    </Button>
  )
}
