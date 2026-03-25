'use client'

import { useActionState, useRef } from 'react'
import { uploadDocument, type DocumentActionState } from '@/app/actions/documents'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UploadIcon, CheckCircle2Icon, ClockIcon, Loader2Icon } from 'lucide-react'
import type { Document } from '@/types/database'

export function DocumentUploadCard({
  type,
  label,
  document,
}: {
  type: 'waiver' | 'drivers_license'
  label: string
  document?: Document | null
}) {
  const [state, formAction, pending] = useActionState<DocumentActionState, FormData>(uploadDocument, null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFileChange = () => {
    // Auto-submit on file selection
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  const isApproved = document?.approved === true
  const isPending = document && !document.approved

  return (
    <Card className={isApproved ? 'border-green-500/50' : undefined}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{label}</CardTitle>
        {isApproved && (
          <Badge variant="default" className="gap-1.5 bg-green-600 text-white hover:bg-green-600">
            <CheckCircle2Icon className="size-3.5" />
            Approved
          </Badge>
        )}
        {isPending && (
          <Badge variant="secondary" className="gap-1.5">
            <ClockIcon className="size-3.5" />
            Awaiting Review
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {state?.error && (
          <div className="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {isApproved ? (
          <p className="text-sm text-muted-foreground">
            Approved on {new Date(document.approved_at!).toLocaleDateString()}.
            You can re-upload to replace this document.
          </p>
        ) : isPending ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Uploaded on {new Date(document.uploaded_at).toLocaleDateString()}.
            </p>
            <p className="text-sm text-muted-foreground">
              The club owner needs to approve this on their end. If you have any questions, contact the club by email or phone.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No document uploaded yet. Please upload your {label.toLowerCase()}.
          </p>
        )}

        <form ref={formRef} action={formAction} className="mt-4">
          <input type="hidden" name="type" value={type} />
          <div
            onClick={() => !pending && fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors ${
              pending ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            {pending ? (
              <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
            ) : (
              <UploadIcon className="size-8 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {pending ? 'Uploading...' : 'Click to select a file'}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPEG, PNG, or WebP (max 10MB)
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
        </form>
      </CardContent>
    </Card>
  )
}
