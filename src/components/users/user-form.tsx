'use client'

import { useActionState, useState } from 'react'
import { createUser, updateUser, type UserActionState } from '@/app/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSelect } from '@/components/form-select'
import type { User } from '@/types/database'
import Link from 'next/link'

export function UserForm({ user }: { user?: User }) {
  const action = user ? updateUser : createUser
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(action, null)
  const [role, setRole] = useState<string>(user?.role ?? 'member')
  const [membershipType, setMembershipType] = useState<string>(user?.membership_type ?? 'monthly')
  const [membershipActive, setMembershipActive] = useState(user?.membership_active ?? true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user ? 'Edit User' : 'Create New User'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {user && <input type="hidden" name="id" value={user.id} />}

          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                name="first_name"
                defaultValue={user?.first_name ?? ''}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                name="last_name"
                defaultValue={user?.last_name ?? ''}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user?.email ?? ''}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              defaultValue={user?.phone_number ?? ''}
              placeholder="(555) 123-4567"
            />
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role *</Label>
              <FormSelect
                name="role"
                placeholder="Select role"
                value={role}
                onChange={setRole}
                options={[
                  { value: 'member', label: 'Member' },
                  { value: 'admin', label: 'Admin' },
                ]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Membership Type *</Label>
              <FormSelect
                name="membership_type"
                placeholder="Select type"
                value={membershipType}
                onChange={setMembershipType}
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'annual', label: 'Annual' },
                ]}
                required
              />
            </div>
          </div>

          {user && (
            <div className="space-y-2">
              <Label>Membership Active</Label>
              <FormSelect
                name="membership_active"
                value={membershipActive ? 'true' : 'false'}
                onChange={(v) => setMembershipActive(v === 'true')}
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/users">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
