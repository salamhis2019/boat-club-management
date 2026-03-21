'use client'

import { useActionState, useState, useRef } from 'react'
import { createBoat, updateBoat, type BoatActionState } from '@/app/actions/boats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Boat } from '@/types/database'
import { FEATURE_OPTIONS, ACTIVITY_OPTIONS } from '@/lib/constants/boats'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function CheckboxGroup({
  name,
  options,
  selected,
  onChange,
}: {
  name: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <>
      <input type="hidden" name={name} value={selected.join(', ')} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition-colors ${
              selected.includes(option)
                ? 'border-primary bg-primary/10 font-medium'
                : 'border-border hover:bg-muted'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="sr-only"
            />
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                selected.includes(option)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input'
              }`}
            >
              {selected.includes(option) && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {option}
          </label>
        ))}
      </div>
    </>
  )
}

export function BoatForm({ boat }: { boat?: Boat }) {
  const action = boat ? updateBoat : createBoat
  const [state, formAction, pending] = useActionState<BoatActionState, FormData>(action, null)
  const [features, setFeatures] = useState<string[]>(boat?.features ?? [])
  const [activities, setActivities] = useState<string[]>(boat?.supported_activities ?? [])
  const [preview, setPreview] = useState<string | null>(boat?.image_url ?? null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const url = URL.createObjectURL(file)
      setPreview(url)
    }
  }

  const clearFile = () => {
    setPreview(boat?.image_url ?? null)
    setFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
            <Label>Features</Label>
            <CheckboxGroup
              name="features"
              options={FEATURE_OPTIONS}
              selected={features}
              onChange={setFeatures}
            />
          </div>

          <div className="space-y-2">
            <Label>Supported Activities</Label>
            <CheckboxGroup
              name="supported_activities"
              options={ACTIVITY_OPTIONS}
              selected={activities}
              onChange={setActivities}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Boat Image</Label>
            {preview && (
              <div className="relative inline-block">
                <Image
                  src={preview}
                  alt={boat?.name ?? 'Preview'}
                  width={200}
                  height={150}
                  className="rounded-md object-cover"
                />
                {fileName && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {fileName ?? 'Click to upload an image'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, or WEBP
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              name="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
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
