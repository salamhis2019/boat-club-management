import { ClubRuleUploadForm } from '@/components/club-rules/club-rule-upload-form'

export default function AdminNewClubRulePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Upload New Rules</h2>
      <ClubRuleUploadForm />
    </div>
  )
}
