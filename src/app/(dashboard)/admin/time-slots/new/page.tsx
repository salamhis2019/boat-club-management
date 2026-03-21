'use client'

import { useActionState } from 'react'
import { createTimeSlot, type TimeSlotActionState } from '@/app/actions/time-slots'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function NewTimeSlotPage() {
  const [state, formAction, pending] = useActionState<TimeSlotActionState, FormData>(createTimeSlot, null)

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Add Time Slot</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Morning"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? 'Adding...' : 'Add Time Slot'}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/time-slots">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
