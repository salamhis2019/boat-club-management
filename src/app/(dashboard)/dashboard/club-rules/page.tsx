import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SignRulesForm } from '@/components/club-rules/sign-rules-form'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, FileText, CalendarDays } from 'lucide-react'
import type { ClubRule, ClubRuleSignature } from '@/types/database'

export default async function MemberClubRulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const serviceClient = createServiceClient()

  // Get the active rule
  const { data: activeRule } = await serviceClient
    .from('club_rules')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()

  const rule = activeRule as ClubRule | null

  if (!rule) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Club Rules</h2>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No club rules have been published yet.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user has signed the active rule
  const { data: signature } = await serviceClient
    .from('club_rule_signatures')
    .select('*')
    .eq('user_id', user!.id)
    .eq('club_rule_id', rule.id)
    .maybeSingle()

  const sig = signature as ClubRuleSignature | null

  if (sig) {
    const signedDate = new Date(sig.signed_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Club Rules</h2>
        <Card className="overflow-hidden border-2 border-green-500 bg-linear-to-br from-green-50 via-emerald-50/50 to-white dark:border-green-600 dark:from-green-950/40 dark:via-emerald-950/20 dark:to-background">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-green-800 dark:text-green-300">
                  Club rules signed
                </p>
                <p className="text-sm text-green-700/80 dark:text-green-400/80">
                  You&apos;re all set — no action needed
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 rounded-lg border border-green-200 bg-white px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Document:</span>
                <span className="font-medium">{rule.title}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Signed:</span>
                <span className="font-medium">{signedDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Club Rules</h2>
      <SignRulesForm ruleId={rule.id} ruleTitle={rule.title} />
    </div>
  )
}
