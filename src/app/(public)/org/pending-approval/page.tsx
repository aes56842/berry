"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/app/lib/supabaseClient"

interface OrgInfo {
  orgName?: string
  statusMessage?: string
  createdAt?: string
}

export default function OrganizationPendingApproval() {
  const router = useRouter()
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkOrgStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkOrgStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/org/login')
      return
    }

    // Check organization status
    try {
      const response = await fetch(`/api/org-status?userId=${session.user.id}`)
      const data = await response.json()

      if (response.ok && data.exists) {
        setOrgInfo(data)

        // If approved, redirect to dashboard
        if (data.approved) {
          router.replace('/dashboard/org')
          return
        }
      }
    } catch (err) {
      console.error('Error checking org status:', err)
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Email Verified Successfully!
            </h1>
            <p className="text-lg text-gray-600">
              Your application is under review
            </p>
          </div>

          {/* Organization Info */}
          {orgInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Organization Details</h3>
              <p className="text-sm text-blue-800">
                <strong>Name:</strong> {orgInfo.orgName}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Status:</strong> {orgInfo.statusMessage}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Submitted:</strong> {orgInfo.createdAt ? new Date(orgInfo.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          )}

          {/* What Happens Next */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              What happens next?
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">✓</span>
                <span>Your email has been verified</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">⏳</span>
                <span>Our admin team is reviewing your application (typically <strong>2-3 business days</strong>)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">📧</span>
                <span>You&apos;ll receive an email notification when your application is approved</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">🚀</span>
                <span>Once approved, you can sign in and start posting opportunities for students</span>
              </li>
            </ul>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Important
            </h3>
            <p className="text-sm text-yellow-800">
              You cannot log in to your dashboard until your organization has been approved by an administrator.
              Please check your email for approval notifications.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSignOut}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium transition-colors"
            >
              Sign Out
            </button>
            <Link
              href="/"
              className="flex-1 px-6 py-3 text-center border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
            >
              Return to Home
            </Link>
          </div>

          {/* Contact Support */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Questions about your application?
            </p>
            <p className="text-sm text-gray-600">
              Contact us at <a href="mailto:support@berry-platform.com" className="text-indigo-600 hover:text-indigo-500 font-medium">support@berry-platform.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}