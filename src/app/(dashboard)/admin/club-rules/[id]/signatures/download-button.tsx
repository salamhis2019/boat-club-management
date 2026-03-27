'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useState } from 'react'

export function DownloadSignedPdfButton({
  signatureUrl,
  memberName,
}: {
  signatureUrl: string
  memberName: string
}) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/club-rules/signed-url?path=${encodeURIComponent(signatureUrl)}`)
      const data = await res.json()
      if (data.url) {
        // Trigger download
        const link = document.createElement('a')
        link.href = data.url
        link.download = `signed-rules-${memberName.replace(/\s+/g, '-').toLowerCase()}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      <Download className="mr-1 size-3.5" />
      {loading ? 'Loading...' : 'Download'}
    </Button>
  )
}
