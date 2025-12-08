'use client'

// Force dynamic rendering to avoid prerendering issues with useSearchParams
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'

// Allowed email domains - get from environment if available
const ALLOWED_DOMAINS = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || "usc.edu,lausd.net").split(",")

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Verifying your authentication...')
  const [error, setError] = useState<string | null>(null)
  
  // Validate if email domain is allowed for students
  const isAllowedStudentDomain = (email: string): boolean => {
    if (!email || !email.includes('@')) return false
    const domain = email.split('@')[1].toLowerCase()
    return ALLOWED_DOMAINS.includes(domain)
  }
  
  // Check if student needs onboarding
  const checkStudentOnboarding = async (userId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/student-profile?userId=${userId}`)
      const data = await response.json()

      if (!response.ok || !data.exists) {
        // No profile exists, need onboarding
        return '/onboarding/profile'
      }

      if (!data.onboardingCompleted) {
        // Profile exists but interests not completed
        return '/onboarding/interests'
      }

      // Onboarding complete, go to dashboard
      return '/dashboard/student'
    } catch (err) {
      console.error('Error checking student onboarding:', err)
      // Default to onboarding if check fails
      return '/onboarding/profile'
    }
  }

  // Handle organization email verification and approval check
  const handleOrgVerification = async (userId: string): Promise<string> => {
    try {
      // Update verification status to email_verified
      await fetch('/api/org-verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          status: 'email_verified'
        })
      })

      // Check if organization is approved
      const orgResponse = await fetch(`/api/org-status?userId=${userId}`)
      const orgData = await orgResponse.json()

      if (orgResponse.ok && orgData.exists) {
        // If approved, go to dashboard
        if (orgData.approved) {
          return '/dashboard/org'
        }

        // Otherwise, show pending approval page
        return '/org/pending-approval'
      }

      // Default to pending if status check fails
      return '/org/pending-approval'
    } catch (err) {
      console.error('Error handling org verification:', err)
      // Default to pending approval page on error
      return '/org/pending-approval'
    }
  }

  // New function to ensure session is properly established and persisted
  const ensureSessionEstablished = async (session: Session) => {
    console.log('Ensuring session is properly established...')

    try {
      // First, explicitly set the session to ensure it's persisted
      if (session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: session.access_token as string,
          refresh_token: session.refresh_token as string
        })

        if (sessionError) {
          console.error('Error setting session:', sessionError)
          return false
        }

        console.log('Session explicitly set')
      }

      // Wait a moment for session to be saved
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify the session was properly saved
      const { data: sessionCheck } = await supabase.auth.getSession()

      const sessionEstablished = !!sessionCheck?.session
      console.log('Session established:', sessionEstablished)

      if (sessionEstablished) {
        // Set a cookie with better attributes for middleware bypass
        document.cookie = 'auth_verification_success=true; path=/; max-age=300; SameSite=Lax'

        // Also store in localStorage as a backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_verified', 'true')
          localStorage.setItem('auth_verified_at', Date.now().toString())
        }

        return true
      }

      return false
    } catch (err) {
      console.error('Error ensuring session:', err)
      return false
    }
  }
    
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for error parameters in URL
        const errorParam = searchParams.get('error')
        const errorCode = searchParams.get('error_code')
        const errorDesc = searchParams.get('error_description')
        
        if (errorParam) {
          // Existing error handling code...
          let errorMessage = errorDesc || `Authentication error: ${errorParam}`
          let redirectMode = "signin"
          
          if (errorParam === 'access_denied' && errorCode === 'otp_expired') {
            errorMessage = "This magic link has expired. Please request a new one."
          } else if (errorParam === 'unauthorized' || errorCode === 'unauthorized') {
            errorMessage = "We couldn't find an account with this email. Please sign up first."
            redirectMode = "signup"
          }
          
          console.error('Auth error from params:', errorMessage)
          setError(errorMessage)
          setTimeout(() => {
            router.push(`/auth?mode=${redirectMode}&error=${errorParam}&message=${encodeURIComponent(errorMessage)}`)
          }, 2000)
          return
        }
        
        setStatus('Processing your authentication...')
        console.log('Starting auth verification process')
        
        // Check for token_hash parameter per Supabase docs
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        
        if (tokenHash && type === 'email') {
          console.log('Found token_hash and type, using verifyOtp')
          
          // Use verifyOtp as documented for PKCE flow with token_hash
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          })
          
          if (error) {
            console.error('OTP verification error:', error)
            throw error
          }
          
          // Check if we have valid data
          if (!data || !data.user) {
            console.error('No user data returned from verifyOtp')
            throw new Error('Authentication failed - no user data received')
          }
          
          // Email domain validation for students
          const email = data.user.email
          const userRole = data.user.user_metadata?.role || 'student' // Default to student if no role
          
          // If user is a student, check if their domain is allowed
          if (userRole === 'student' && email && !isAllowedStudentDomain(email)) {
            console.error('Domain not allowed for student accounts:', email)
            
            // Sign out the user immediately
            await supabase.auth.signOut()
            
            // Redirect to signup with an error message
            const errorMessage = `Student accounts require an email address from ${ALLOWED_DOMAINS.join(" or ")}.`
            router.push(`/auth?mode=signup&error=domain_not_allowed&message=${encodeURIComponent(errorMessage)}`)
            return
          }
          
          // Ensure session is established
          if (data.session) {
            await ensureSessionEstablished(data.session)
          } else {
            console.error('No session data returned from verifyOtp')
          }

          // Get user role and determine redirect path
          const role = data.user?.user_metadata?.role
          let redirectPath: string

          if (role === 'student') {
            // Check if student needs onboarding
            redirectPath = await checkStudentOnboarding(data.user.id)
          } else if (role === 'org') {
            // Handle organization email verification and approval check
            redirectPath = await handleOrgVerification(data.user.id)
          } else {
            redirectPath = '/dashboard'
          }

          console.log('Redirecting to:', redirectPath)
          setStatus(`Authentication successful! Redirecting...`)

          // Use replace instead of push for more reliable navigation
          router.replace(redirectPath)

          // Fallback navigation with improved reliability
          setTimeout(() => {
            if (!window.location.pathname.startsWith('/dashboard') && !window.location.pathname.startsWith('/onboarding')) {
              console.log('Using fallback navigation')
              window.location.href = redirectPath
            }
          }, 1500)

          return
        }
        
        // Fallback to code exchange if no token_hash (for older links)
        console.log('No token_hash found, trying exchangeCodeForSession')
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        
        if (error) {
          console.error('Code exchange error:', error)
          throw error
        }
        
        // Check if we have valid data
        if (!data || !data.user || !data.session) {
          console.error('No user or session data found after code exchange')
          throw new Error('Failed to authenticate - no user data received')
        }
        
        // Email domain validation for students (code exchange flow)
        const email = data.user.email
        const userRole = data.user.user_metadata?.role || 'student' // Default to student if no role
        
        // If user is a student, check if their domain is allowed
        if (userRole === 'student' && !isAllowedStudentDomain(email ?? '')) {
          console.error('Domain not allowed for student accounts:', email)
          
          // Sign out the user immediately
          await supabase.auth.signOut()
          
          // Redirect to signup with an error message
          const errorMessage = `Student accounts require an email address from ${ALLOWED_DOMAINS.join(" or ")}.`
          router.push(`/auth?mode=signup&error=domain_not_allowed&message=${encodeURIComponent(errorMessage)}`)
          return
        }
        
        // Ensure session is established for code exchange flow
        await ensureSessionEstablished(data.session)

        // Authentication successful
        console.log('Authentication successful with code exchange!', data.user)

        // Get user role and determine redirect path
        const role = data.user?.user_metadata?.role
        let redirectPath: string

        if (role === 'student') {
          // Check if student needs onboarding
          redirectPath = await checkStudentOnboarding(data.user.id)
        } else if (role === 'org') {
          // Handle organization email verification and approval check
          redirectPath = await handleOrgVerification(data.user.id)
        } else {
          redirectPath = '/dashboard'
        }

        setStatus(`Authentication successful! Redirecting...`)

        // Use replace for more reliable navigation
        router.replace(redirectPath)

        // Fallback navigation with improved reliability
        setTimeout(() => {
          if (!window.location.pathname.startsWith('/dashboard') && !window.location.pathname.startsWith('/onboarding')) {
            console.log('Using fallback navigation')
            window.location.href = redirectPath
          }
        }, 1500)
        
      } catch (err: unknown) {
        console.error('Auth verification error:', err)
        setError(`Authentication error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        
        // Try to check if we have a session despite the error
        try {
          const { data } = await supabase.auth.getSession()
          if (data?.session?.user) {
            // We have a session, ensure it's properly established
            await ensureSessionEstablished(data.session)
            
            // Do additional domain validation
            const email = data.session.user.email
            const userRole = data.session.user.user_metadata?.role || 'student'
            
            // If user is a student, check if their domain is allowed
            if (userRole === 'student' && !isAllowedStudentDomain(email ?? '')) {
              console.error('Domain not allowed for student accounts:', email)
              
              // Sign out the user immediately
              await supabase.auth.signOut()
              
              // Redirect to signup with an error message
              const errorMessage = `Student accounts require an email address from ${ALLOWED_DOMAINS.join(" or ")}.`
              router.push(`/auth?mode=signup&error=domain_not_allowed&message=${encodeURIComponent(errorMessage)}`)
              return
            }
            
            // Domain is valid, redirect to dashboard
            const role = data.session.user.user_metadata?.role
            const redirectPath = role === 'student' ? '/dashboard/student' : 
                               role === 'org' ? '/dashboard/org' : 
                               '/dashboard'
            
            setStatus(`Already authenticated! Redirecting...`)
            router.replace(redirectPath)
            
            // Fallback navigation with improved reliability
            setTimeout(() => {
              if (!window.location.pathname.startsWith('/dashboard')) {
                console.log('Using fallback navigation')
                window.location.href = redirectPath
              }
            }, 1500)
            
            return
          }
        } catch (sessionErr) {
          console.error('Error checking session:', sessionErr)
          // Ignore errors checking session
        }
        
        setTimeout(() => {
          router.push(`/auth?error=verification_error&message=${encodeURIComponent(err instanceof Error ? err.message : 'Unknown error')}`)
        }, 2000)
      }
    }
    
    // Only run auth handling once
    handleAuth()
  }, [router, searchParams])
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Verifying Your Account</h1>

        {error ? (
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <p className="text-gray-600">Redirecting back to login page...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{status}</p>
          </div>
        )}
      </div>
    </div>
  )
}