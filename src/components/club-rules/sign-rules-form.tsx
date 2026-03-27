'use client'

import { useState, useActionState, useEffect } from 'react'
import { signClubRule, type ClubRuleActionState } from '@/app/actions/club-rules'
import { SignaturePad } from '@/components/club-rules/signature-pad'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type SignRulesFormProps = {
  ruleId: string
  ruleTitle: string
}

export function SignRulesForm({ ruleId, ruleTitle }: SignRulesFormProps) {
  const [state, formAction, pending] = useActionState<ClubRuleActionState, FormData>(signClubRule, null)
  const [signature, setSignature] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/club-rules/${ruleId}/url`)
      .then((res) => res.json())
      .then((data) => setPdfUrl(data.url ?? null))
  }, [ruleId])

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      router.refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, router])

  if (state?.success) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8">
          <CheckCircle2 className="size-6 text-green-600" />
          <p className="font-medium text-green-700 dark:text-green-400">{state.success}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{ruleTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="h-[500px] w-full rounded-lg border"
              title="Club Rules PDF"
            />
          ) : (
            <div className="flex h-[500px] items-center justify-center rounded-lg border bg-muted">
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign the Club Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {state?.error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {state.error}
            </div>
          )}

          <form
            action={(formData) => {
              if (signature) {
                formData.set('signature', signature)
              }
              formAction(formData)
            }}
            className="space-y-6"
          >
            <input type="hidden" name="club_rule_id" value={ruleId} />

            <SignaturePad onSignatureChange={setSignature} />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="size-4 rounded border-gray-300"
              />
              <label htmlFor="agree" className="cursor-pointer text-sm">
                I have read and agree to the club rules and terms
              </label>
            </div>

            <Button
              type="submit"
              disabled={pending || !signature || !agreed}
              size="lg"
            >
              {pending ? 'Submitting...' : 'Submit Signature'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
