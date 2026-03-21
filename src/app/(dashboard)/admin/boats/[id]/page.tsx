import { createClient } from '@/lib/supabase/server'
import { BoatForm } from '@/components/boats/boat-form'
import { notFound } from 'next/navigation'

export default async function EditBoatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: boat } = await supabase
    .from('boats')
    .select('*')
    .eq('id', id)
    .single()

  if (!boat) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <BoatForm boat={boat} />
    </div>
  )
}
