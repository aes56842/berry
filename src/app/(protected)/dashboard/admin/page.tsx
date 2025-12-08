"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"
import Image from "next/image"
import Link from "next/link"

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
    totalStudents: 0,
    totalOrganizations: 0,
    totalOpportunities: 0,
    pendingApprovals: 0
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

      const userRole = session.user.user_metadata?.role
      if (userRole !== 'admin') {
        router.push(userRole === 'student' ? '/dashboard/student' :
                   userRole === 'org' ? '/dashboard/org' :
                   '/dashboard')
        return
      }

      setUser(session.user)
      await Promise.all([
        fetchOrganizations(),
        fetchStats()
      ])
    }

    checkUser()
  }, [router])

  const fetchStats = async () => {
    try {
      const [studentsRes, orgsRes, oppsRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/organizations'),
        fetch('/api/admin/opportunities')
      ])

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStats(prev => ({ ...prev, totalStudents: studentsData.total }))
      }

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json()
        setStats(prev => ({
          ...prev,
          totalOrganizations: orgsData.total,
          pendingApprovals: orgsData.pending?.length || 0
        }))
      }

      if (oppsRes.ok) {
        const oppsData = await oppsRes.json()
        setStats(prev => ({ ...prev, totalOpportunities: oppsData.total }))
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
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
        await Promise.all([fetchOrganizations(), fetchStats()])
      } else {
        console.error('Failed to update organization')
      }
    } catch (error) {
      console.error('Error updating organization:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  const getVerificationBadge = (status: Organization['verification_status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
            Awaiting Email Verification
          </span>
        )
      case 'email_verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
            Email Verified - Ready for Review
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-400/30">
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#004aad]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const firstName = user.user_metadata?.first_name || ''
  const lastName = user.user_metadata?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || user.email

  return (
    <div className="min-h-screen bg-[#004aad] text-white font-[Marble]">
      {/* Top bar */}
      <nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard/admin" className="flex items-center">
              <Image
                src="/logos/BERRY%20LOGO%20%28svg%29.png"
                alt="BERRY logo"
                width={160}
                height={60}
                className="h-auto w-40 max-w-full select-none transition-[filter] duration-200 hover:drop-shadow-[0_0_16px_rgba(247,127,190,0.65)]"
                priority
              />
            </Link>

            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full border border-white/60 text-sm font-[Marble] hover:bg-white hover:text-[#004aad] transition-all hover:shadow-[0_0_18px_rgba(247,127,190,0.55)]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl mb-4 text-center">
          Welcome, <span className="text-[#f77fbe]">{fullName}</span>!
        </h2>
        <p className="text-center text-lg text-blue-100 mb-10">Admin Dashboard</p>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 rounded-2xl border-2 border-white/40 p-6 hover:-translate-y-1 transition-transform duration-200 hover:shadow-[0_15px_40px_rgba(82,178,191,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-[#52b2bf]">{stats.totalStudents}</p>
              </div>
              <svg className="h-12 w-12 text-[#52b2bf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl border-2 border-white/40 p-6 hover:-translate-y-1 transition-transform duration-200 hover:shadow-[0_15px_40px_rgba(247,127,190,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Organizations</p>
                <p className="text-3xl font-bold text-[#f77fbe]">{stats.totalOrganizations}</p>
              </div>
              <svg className="h-12 w-12 text-[#f77fbe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl border-2 border-white/40 p-6 hover:-translate-y-1 transition-transform duration-200 hover:shadow-[0_15px_40px_rgba(82,178,191,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-yellow-300">{stats.pendingApprovals}</p>
              </div>
              <svg className="h-12 w-12 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl border-2 border-white/40 p-6 hover:-translate-y-1 transition-transform duration-200 hover:shadow-[0_15px_40px_rgba(247,127,190,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Opportunities</p>
                <p className="text-3xl font-bold text-purple-300">{stats.totalOpportunities}</p>
              </div>
              <svg className="h-12 w-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="card mb-12 rounded-3xl bg-white/10 border-2 border-white/40 shadow-[0_30px_80px_rgba(82,178,191,0.35)] px-8 py-8 backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_35px_90px_rgba(247,127,190,0.35)]">
          <h3 className="text-2xl font-bold mb-6 text-[#f77fbe]">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push("/dashboard/admin/students")}
              className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[#004aad] border border-white/30 hover:bg-[#00327a] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)]"
            >
              <svg className="h-12 w-12 text-[#52b2bf] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="text-lg font-[Marble]">Manage Students</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/admin/organizations")}
              className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[#004aad] border border-white/30 hover:bg-[#00327a] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)]"
            >
              <svg className="h-12 w-12 text-[#f77fbe] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-lg font-[Marble]">Manage Organizations</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/admin/opportunities")}
              className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[#004aad] border border-white/30 hover:bg-[#00327a] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)]"
            >
              <svg className="h-12 w-12 text-purple-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-lg font-[Marble]">Manage Opportunities</span>
            </button>
          </div>
        </section>

        {/* Organization Approval Section */}
        <section className="space-y-8">
          {/* Pending Organizations */}
          <div className="bg-white/10 rounded-3xl border-2 border-white/40 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#f77fbe]">
                Pending Organizations ({organizations.pending.length})
              </h3>
              <button
                onClick={fetchOrganizations}
                className="text-sm text-[#52b2bf] hover:text-[#f77fbe] transition-colors"
              >
                Refresh
              </button>
            </div>

            {organizations.pending.length === 0 ? (
              <p className="text-blue-200 text-center py-8">No pending organizations</p>
            ) : (
              <div className="space-y-4">
                {organizations.pending.map((org) => (
                  <div key={org.id} className="bg-[#003580] rounded-2xl p-5 border border-white/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-semibold">{org.org_name}</h4>
                          {getVerificationBadge(org.verification_status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-100">
                          <div>
                            <p><strong className="text-[#52b2bf]">Type:</strong> {org.org_type}</p>
                            <p><strong className="text-[#52b2bf]">Email:</strong> {org.org_email}</p>
                            <p><strong className="text-[#52b2bf]">Phone:</strong> {org.org_phone}</p>
                          </div>
                          <div>
                            <p><strong className="text-[#52b2bf]">Business ID:</strong> {org.business_id}</p>
                            <p><strong className="text-[#52b2bf]">Submitted:</strong> {new Date(org.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-[#52b2bf] font-semibold">Description:</p>
                          <p className="text-sm text-blue-100 mt-1">{org.org_description}</p>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => handleApproveOrganization(org.id, true)}
                          disabled={actionLoading === org.id}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === org.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleApproveOrganization(org.id, false)}
                          disabled={actionLoading === org.id}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        </section>
      </main>
    </div>
  )
}
