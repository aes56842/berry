"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth?mode=signin")
        return
      }

      // Get user role from metadata
      const role = session.user.user_metadata?.role

      // Auto-redirect based on role
      if (role === 'student') {
        // Check if student needs onboarding
        try {
          const response = await fetch(`/api/student-profile?userId=${session.user.id}`)
          const data = await response.json()

          if (!data.exists) {
            router.replace('/onboarding/profile')
            return
          }

          if (!data.onboardingCompleted) {
            router.replace('/onboarding/interests')
            return
          }

          router.replace('/dashboard/student')
        } catch (err) {
          console.error('Error checking student profile:', err)
          router.replace('/dashboard/student')
        }
      } else if (role === 'org') {
        // Check organization approval status
        try {
          const response = await fetch(`/api/org-status?userId=${session.user.id}`)
          const data = await response.json()

          if (data.exists && !data.approved) {
            // Organization not yet approved, redirect to pending page
            router.replace('/org/pending-approval')
            return
          }

          router.replace('/dashboard/org')
        } catch (err) {
          console.error('Error checking org status:', err)
          router.replace('/dashboard/org')
        }
      } else if (role === 'admin') {
        router.replace('/dashboard/admin')
      } else {
        // No role found - this is an edge case
        // Keep user on this page to manually select
        setLoading(false)
      }
    }

    checkUserAndRedirect()
  }, [router])

  // Loading state while redirecting
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Fallback UI if no role is found (edge case)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100 mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Incomplete</h2>
          <p className="text-gray-600 mb-6">
            Your account role hasn&apos;t been set up properly. Please contact support or sign up again.
          </p>
          <div className="space-y-3">
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/auth?mode=signup')
              }}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
              Sign Up Again
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
              }}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
