'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { approveDocument, rejectDocument } from '@/app/actions/documents'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ApproveButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    setLoading(true)
    const result = await approveDocument(documentId)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Document approved successfully.')
      router.refresh()
    }
  }

  return (
    <Button size="sm" onClick={handleApprove} disabled={loading}>
      {loading ? 'Approving...' : 'Approve'}
    </Button>
  )
}

export function RejectButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleReject = async () => {
    setLoading(true)
    const result = await rejectDocument(documentId)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Document rejected and removed.')
      router.refresh()
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleReject} disabled={loading}>
      {loading ? 'Rejecting...' : 'Reject'}
    </Button>
  )
}

export function RevokeButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRevoke = async () => {
    setLoading(true)
    const result = await rejectDocument(documentId)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Document approval revoked.')
      router.refresh()
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={loading}>
      {loading ? 'Revoking...' : 'Revoke'}
    </Button>
  )
}
