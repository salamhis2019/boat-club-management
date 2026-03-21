'use client'

import { useActionState } from 'react'
import { createBoat, updateBoat, type BoatActionState } from '@/app/actions/boats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Boat } from '@/types/database'
import Image from 'next/image'
import Link from 'next/link'

export function BoatForm({ boat }: { boat?: Boat }) {
  const action = boat ? updateBoat : createBoat
  const [state, formAction, pending] = useActionState<BoatActionState, FormData>(action, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{boat ? 'Edit Boat' : 'Add New Boat'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {boat && <input type="hidden" name="id" value={boat.id} />}

          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Boat Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={boat?.name ?? ''}
              placeholder="e.g. Sea Breeze"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={boat?.description ?? ''}
              placeholder="General info about the boat"
              rows={3}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                defaultValue={boat?.capacity ?? 1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horsepower">Horsepower</Label>
              <Input
                id="horsepower"
                name="horsepower"
                defaultValue={boat?.horsepower ?? ''}
                placeholder="e.g. 250 HP"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="features">Features</Label>
            <Input
              id="features"
              name="features"
              defaultValue={boat?.features?.join(', ') ?? ''}
              placeholder="GPS, Bluetooth, Fish Finder (comma-separated)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supported_activities">Supported Activities</Label>
            <Input
              id="supported_activities"
              name="supported_activities"
              defaultValue={boat?.supported_activities?.join(', ') ?? ''}
              placeholder="Fishing, Tubing, Cruising (comma-separated)"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="image">Boat Image</Label>
            {boat?.image_url && (
              <div className="mb-2">
                <Image
                  src={boat.image_url}
                  alt={boat.name}
                  width={200}
                  height={150}
                  className="rounded-md object-cover"
                />
              </div>
            )}
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : boat ? 'Update Boat' : 'Add Boat'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/boats">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
