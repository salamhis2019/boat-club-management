'use client'

import { useActionState } from 'react'
import { login, type AuthState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, null)

  return (
    <Card className="shadow-lg">
      <CardContent>
        <div className="my-10 text-center">
          <Image
            src="/logo.png"
            alt="Lake Toys Boat Club"
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Lake Toys Boat Club
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="h-11 w-full cursor-pointer text-base bg-gradient-to-r from-[#1c3d83] to-[#2a9ed1] hover:from-[#1c3d83]/90 hover:to-[#2a9ed1]/90 text-white border-0" disabled={pending}>
              {pending ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="text-center">
              <Link
                href="/reset-password"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
  )
}
