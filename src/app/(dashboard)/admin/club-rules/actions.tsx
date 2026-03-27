'use client'

import { setActiveRule, deleteClubRule } from '@/app/actions/club-rules'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Eye } from 'lucide-react'

export function PreviewRuleButton({ ruleId }: { ruleId: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/club-rules/${ruleId}/url`)
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
      <Eye className="mr-1 size-3.5" />
      {loading ? 'Loading...' : 'Preview'}
    </Button>
  )
}

export function SetActiveButton({ ruleId }: { ruleId: string }) {
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    setPending(true)
    await setActiveRule(ruleId)
    setPending(false)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? 'Setting...' : 'Set Active'}
    </Button>
  )
}

export function DeleteRuleButton({ ruleId }: { ruleId: string }) {
  const [pending, setPending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    setPending(true)
    await deleteClubRule(ruleId)
    setPending(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
          {pending ? 'Deleting...' : 'Confirm'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  )
}
