import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toggleBoatActive } from '@/app/actions/boats'
import Link from 'next/link'

export default async function BoatsPage() {
  const supabase = await createClient()
  const { data: boats } = await supabase
    .from('boats')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Boats</h2>
        <Button asChild>
          <Link href="/admin/boats/new">Add Boat</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Horsepower</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boats && boats.length > 0 ? (
            boats.map((boat) => (
              <TableRow key={boat.id}>
                <TableCell className="font-medium">{boat.name}</TableCell>
                <TableCell>{boat.capacity}</TableCell>
                <TableCell>{boat.horsepower || '—'}</TableCell>
                <TableCell>
                  <Badge variant={boat.is_active ? 'default' : 'secondary'}>
                    {boat.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/boats/${boat.id}`}>Edit</Link>
                    </Button>
                    <form action={toggleBoatActive.bind(null, boat.id)}>
                      <Button variant="ghost" size="sm">
                        {boat.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No boats yet. Add your first boat to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
