import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DocumentUploadCard } from '@/components/documents/document-upload-card'
import { AlertTriangleIcon } from 'lucide-react'
import type { Document } from '@/types/database'

export default async function MemberDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const serviceClient = createServiceClient()

  const { data: profile } = await serviceClient
    .from('users')
    .select('documents_approved')
    .eq('id', user!.id)
    .single()

  const { data: documents } = await serviceClient
    .from('documents')
    .select('*')
    .eq('user_id', user!.id)

  const docs = (documents ?? []) as Document[]
  const waiver = docs.find((d) => d.type === 'waiver') ?? null
  const driversLicense = docs.find((d) => d.type === 'drivers_license') ?? null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Documents</h2>

      {!profile?.documents_approved && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
          <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Documents required</p>
            <p className="text-sm text-amber-700">
              Upload and get your documents approved to start booking reservations.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <DocumentUploadCard
          type="waiver"
          label="Waiver"
          document={waiver}
        />
        <DocumentUploadCard
          type="drivers_license"
          label="Driver's License"
          document={driversLicense}
        />
      </div>
    </div>
  )
}
