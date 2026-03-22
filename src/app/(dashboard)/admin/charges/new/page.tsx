'use client'

import { useState, useEffect, useActionState } from 'react'
import { createCharge, type ChargeActionState } from '@/app/actions/charges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSelect } from '@/components/form-select'
import Link from 'next/link'

type Member = {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function AdminNewChargePage() {
  const [state, formAction, pending] = useActionState<ChargeActionState, FormData>(createCharge, null)
  const [members, setMembers] = useState<Member[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [chargeType, setChargeType] = useState('')

  useEffect(() => {
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => setMembers(data.members ?? []))
  }, [])

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Create Charge</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            {state?.success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {state.success}
              </div>
            )}

            <div className="space-y-2">
              <Label>Member *</Label>
              <FormSelect
                name="user_id"
                placeholder="Select a member"
                value={selectedUser}
                onChange={setSelectedUser}
                required
                options={members.map((m) => ({
                  value: m.id,
                  label: `${m.first_name} ${m.last_name} (${m.email})`,
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.50"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <FormSelect
                  name="type"
                  placeholder="Select type"
                  value={chargeType}
                  onChange={setChargeType}
                  required
                  options={[
                    { value: 'gas', label: 'Gas' },
                    { value: 'misc', label: 'Miscellaneous' },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="e.g. Gas refill for Sea Breeze on 3/21"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={pending || !selectedUser || !chargeType}>
                {pending ? 'Creating...' : 'Create Charge'}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/charges">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
