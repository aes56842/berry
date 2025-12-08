"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"

interface Organization {
  id: number
  org_name: string
  org_type: string
  org_email: string
  org_phone: string
  org_description: string
  business_id: string
  approved: boolean
  verification_status: 'pending' | 'email_verified' | 'approved' | 'rejected'
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { first_name?: string; last_name?: string; role?: string } } | null>(null)
  const [stats, setStats] = useState({
    totalUsers: 156,
    totalOrganizations: 0,
    pendingRegistrations: 0,
    activeConnections: 89
  })
  const [organizations, setOrganizations] = useState<{
    pending: Organization[]
    approved: Organization[]
  }>({
    pending: [],
    approved: []
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/auth?mode=signin")
        return
      }
      
      // Verify this is an admin user
      const userRole = session.user.user_metadata?.role
      if (userRole !== 'admin') {
        // If not admin, redirect to appropriate dashboard
        router.push(userRole === 'student' ? '/dashboard/student' : 
                   userRole === 'org' ? '/dashboard/org' : 
                   '/dashboard')
        return
      }
      
      setUser(session.user)
      fetchOrganizations()
    }
    
    checkUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations({
          pending: data.pending,
          approved: data.approved
        })
        setStats(prev => ({
          ...prev,
          totalOrganizations: data.total,
          pendingRegistrations: data.pending.length
        }))
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveOrganization = async (organizationId: number, approved: boolean) => {
    setActionLoading(organizationId)
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          approved
        })
      })

      if (response.ok) {
        // Refresh the organizations list
        await fetchOrganizations()
      } else {
        console.error('Failed to update organization')
      }
    } catch (error) {
      console.error('Error updating organization:', error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Get user's name from metadata or email
  const firstName = user.user_metadata?.first_name || ''
  const lastName = user.user_metadata?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || user.email

  // Helper function to get verification status badge
  const getVerificationBadge = (status: Organization['verification_status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Awaiting Email Verification
          </span>
        )
      case 'email_verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Email Verified - Ready for Review
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-red-600">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {fullName}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Organizations</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalOrganizations}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Reviews</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pendingRegistrations}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Connections</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeConnections}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">New organization registration from ABC Learning Center</p>
                      <p className="text-sm text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">Student John Doe joined platform</p>
                      <p className="text-sm text-gray-500">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">Organization XYZ Foundation approved</p>
                      <p className="text-sm text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
                    <span className="text-sm font-medium text-blue-900">Review Pending Organizations</span>
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors">
                    <span className="text-sm font-medium text-green-900">Manage User Accounts</span>
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors">
                    <span className="text-sm font-medium text-purple-900">View System Analytics</span>
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors">
                    <span className="text-sm font-medium text-red-900">System Settings</span>
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Management */}
          <div className="mt-8 space-y-8">
            {/* Pending Organizations */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Pending Organizations ({organizations.pending.length})
                  </h3>
                  <button
                    onClick={fetchOrganizations}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Refresh
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : organizations.pending.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending organizations</p>
                ) : (
                  <div className="space-y-4">
                    {organizations.pending.map((org) => (
                      <div key={org.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{org.org_name}</h4>
                              {getVerificationBadge(org.verification_status)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p><strong>Type:</strong> {org.org_type}</p>
                                <p><strong>Email:</strong> {org.org_email}</p>
                                <p><strong>Phone:</strong> {org.org_phone}</p>
                              </div>
                              <div>
                                <p><strong>Business ID:</strong> {org.business_id}</p>
                                <p><strong>Submitted:</strong> {new Date(org.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-700"><strong>Description:</strong></p>
                              <p className="text-sm text-gray-600 mt-1">{org.org_description}</p>
                            </div>
                          </div>
                          <div className="ml-4 flex space-x-2">
                            <button
                              onClick={() => handleApproveOrganization(org.id, true)}
                              disabled={actionLoading === org.id}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === org.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleApproveOrganization(org.id, false)}
                              disabled={actionLoading === org.id}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Approved Organizations */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Approved Organizations ({organizations.approved.length})
                </h3>
                
                {organizations.approved.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No approved organizations</p>
                ) : (
                  <div className="space-y-4">
                    {organizations.approved.map((org) => (
                      <div key={org.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{org.org_name}</h4>
                              {getVerificationBadge(org.verification_status)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p><strong>Type:</strong> {org.org_type}</p>
                                <p><strong>Email:</strong> {org.org_email}</p>
                                <p><strong>Phone:</strong> {org.org_phone}</p>
                              </div>
                              <div>
                                <p><strong>Business ID:</strong> {org.business_id}</p>
                                <p><strong>Approved:</strong> {new Date(org.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-700"><strong>Description:</strong></p>
                              <p className="text-sm text-gray-600 mt-1">{org.org_description}</p>
                            </div>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => handleApproveOrganization(org.id, false)}
                              disabled={actionLoading === org.id}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === org.id ? 'Revoking...' : 'Revoke Approval'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Admin Information</h3>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <p><strong>Name:</strong> {fullName}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> System Administrator</p>
                  <p><strong>Access Level:</strong> Full System Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
