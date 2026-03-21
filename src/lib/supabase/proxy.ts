import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/reset-password', '/update-password']
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // API routes that don't require auth
  const publicApiRoutes = ['/api/health', '/api/webhooks', '/api/auth']
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute && !isPublicApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If authenticated and trying to access login/public auth page
  if (user && isPublicRoute) {
    // Look up role to redirect to correct dashboard
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role: UserRole = profile?.role ?? 'member'
    const url = request.nextUrl.clone()
    url.pathname = role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-based route protection for authenticated users
  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname === '/')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role: UserRole = profile?.role ?? 'member'
    const url = request.nextUrl.clone()

    // Root path → redirect to correct dashboard
    if (pathname === '/') {
      url.pathname = role === 'admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(url)
    }

    // Non-admin trying to access admin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Admin trying to access member routes
    if (pathname.startsWith('/dashboard') && role === 'admin') {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
