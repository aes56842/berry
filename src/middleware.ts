import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('\n🔄 MIDDLEWARE EXECUTING FOR:', req.nextUrl.pathname);
  
  // Create a response object
  const res = NextResponse.next()
  
  // Create Supabase client with request/response
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if available for all routes
  await supabase.auth.getSession()

  // ─────────────────────────────────────────────────────────────────────────────
  // ONBOARDING ROUTES (students only): Allow access if session exists
  // These routes should be accessible without completed onboarding
  // ─────────────────────────────────────────────────────────────────────────────
  if (req.nextUrl.pathname.startsWith('/onboarding')) {
    const { data: { session } } = await supabase.auth.getSession()
    
    // If no session, redirect to auth
    if (!session) {
      console.log('No session for onboarding route — redirecting to auth')
      return NextResponse.redirect(new URL('/auth?mode=signin', req.url))
    }
    
    // Session exists, allow access to onboarding
    console.log('Session exists, allowing onboarding access')
    return res
  }
  
  // Only apply auth protection for dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      // Check if auth verification just happened (using cookie) — for ORG flow only
      const authJustVerified = req.cookies.get('auth_verification_success')
      
      // Get session AFTER refresh attempt
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session){
        console.log('Session found in middleware for user:', session.user.id)
      }
      if (!session) {
        console.log('No session found in middleware')
      }
      
      // If no session found, try another refresh first
      if (!session) {
        // Try refreshing the session one more time
        const refreshResult = await supabase.auth.refreshSession()
        
        // If refresh worked, continue with that session
        if (!refreshResult.data.session) {
          // Otherwise redirect to login
          return NextResponse.redirect(new URL('/auth?mode=signin', req.url))
        }
      }
      
      // Re-fetch session after potential refresh
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (!currentSession) {
        console.log('Still no session after refresh — redirecting to auth')
        return NextResponse.redirect(new URL('/auth?mode=signin', req.url))
      }
      
      const role = currentSession.user?.user_metadata?.role
      const userId = currentSession.user.id

      // ─────────────────────────────────────────────────────────────────────────
      // STUDENT FLOW: Check onboarding status before allowing dashboard access
      // IMPORTANT: Session existence does NOT mean onboarding is complete.
      // We must verify the student profile exists and onboarding_completed = true.
      // ─────────────────────────────────────────────────────────────────────────
      if (req.nextUrl.pathname.startsWith('/dashboard/student')) {
        if (role !== 'student') {
          // Redirect to appropriate dashboard based on role
          const redirectPath = role === 'org' ? '/dashboard/org' : '/dashboard'
          return NextResponse.redirect(new URL(redirectPath, req.url))
        }
        
        // For students, check onboarding status
        try {
          // Fetch student profile to check onboarding status
          // Use absolute URL for server-side fetch in middleware
          const profileUrl = new URL(`/api/student-profile?userId=${userId}`, req.url)
          const profileResponse = await fetch(profileUrl.toString(), {
            cache: 'no-store',
            headers: {
              // Forward cookies so the API can authenticate
              cookie: req.headers.get('cookie') || ''
            }
          })
          
          const profileData = await profileResponse.json()
          
          console.log('Student profile check:', {
            exists: profileData.exists,
            onboardingCompleted: profileData.onboardingCompleted
          })
          
          // Case A: No profile exists → redirect to /onboarding/profile
          if (!profileResponse.ok || !profileData.exists) {
            console.log('No student profile exists — redirecting to /onboarding/profile')
            return NextResponse.redirect(new URL('/onboarding/profile', req.url))
          }
          
          // Case B: Profile exists but onboarding not completed → redirect to /onboarding/interests
          if (!profileData.onboardingCompleted) {
            console.log('Student onboarding not completed — redirecting to /onboarding/interests')
            return NextResponse.redirect(new URL('/onboarding/interests', req.url))
          }
          
          // Case C: Onboarding complete → allow dashboard access
          console.log('Student onboarding complete — allowing dashboard access')
          
        } catch (profileError) {
          console.error('Error checking student profile:', profileError)
          // On error, redirect to onboarding/profile as a safe fallback
          // This prevents access to dashboard if we can't verify onboarding status
          return NextResponse.redirect(new URL('/onboarding/profile', req.url))
        }
      }
      
      // ─────────────────────────────────────────────────────────────────────────
      // ORG FLOW: Keep existing behavior (no onboarding check required)
      // If org user just verified (cookie exists), let them through
      // ─────────────────────────────────────────────────────────────────────────
      if (req.nextUrl.pathname.startsWith('/dashboard/org')) {
        if (role !== 'org') {
          // Redirect to appropriate dashboard based on role
          const redirectPath = role === 'student' ? '/dashboard/student' : '/dashboard'
          return NextResponse.redirect(new URL(redirectPath, req.url))
        }
        
        // For orgs, allow auth_verification_success bypass (existing behavior)
        if (authJustVerified?.value === 'true') {
          console.log('Org auth just verified, bypassing additional checks')
          return res
        }
      }
      
      // ─────────────────────────────────────────────────────────────────────────
      // Generic /dashboard redirect based on role
      // ─────────────────────────────────────────────────────────────────────────
      if (req.nextUrl.pathname === '/dashboard') {
        if (role === 'student') {
          return NextResponse.redirect(new URL('/dashboard/student', req.url))
        } else if (role === 'org') {
          return NextResponse.redirect(new URL('/dashboard/org', req.url))
        }
      }
      
    } catch (error) {
      console.error('Middleware auth error:', error)
      // In case of error, redirect to login
      return NextResponse.redirect(new URL('/auth?error=session_error', req.url))
    }
  }
  
  // Continue with the request and include any updated cookies
  return res
}

export const config = {
  matcher: [
    // Match all requests except for static assets, API routes, etc.
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ]
}