'use client'

import { useActionState, useRef, useState } from 'react'
import { uploadClubRule, type ClubRuleActionState } from '@/app/actions/club-rules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { AlertCircle, Upload, FileText } from 'lucide-react'
import Link from 'next/link'

export function ClubRuleUploadForm() {
  const [state, formAction, pending] = useActionState<ClubRuleActionState, FormData>(uploadClubRule, null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Upload Club Rules</CardTitle>
      </CardHeader>
      <CardContent>
        {state?.error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Club Rules & Terms v3"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">PDF File</Label>
            <div
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50"
              onClick={() => fileRef.current?.click()}
            >
              {fileName ? (
                <>
                  <FileText className="size-8 text-primary" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Click to change file</p>
                </>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to select a PDF file (max 10MB)</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              id="file"
              name="file"
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="setActive"
              name="setActive"
              value="true"
              className="size-4 rounded border-gray-300"
            />
            <Label htmlFor="setActive" className="cursor-pointer font-normal">
              Set as active immediately
            </Label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? 'Uploading...' : 'Upload Rules'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/club-rules">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
