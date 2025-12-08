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

export default function AdminOrganizationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { first_name?: string; last_name?: string; role?: string } } | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

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
        router.push('/dashboard')
        return
      }

      setUser(session.user)
      fetchOrganizations()
    }

    checkUser()
  }, [router])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        // Combine pending and approved into single array
        setOrganizations([...data.pending, ...data.approved])
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrganization = async (organizationId: number) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return
    }

    setActionLoading(organizationId)
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId })
      })

      if (response.ok) {
        await fetchOrganizations()
      } else {
        alert('Failed to delete organization')
      }
    } catch (error) {
      console.error('Error deleting organization:', error)
      alert('Error deleting organization')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  const filteredOrganizations = organizations.filter(org => {
    const search = searchTerm.toLowerCase()
    return (
      org.org_name?.toLowerCase().includes(search) ||
      org.org_email?.toLowerCase().includes(search) ||
      org.org_type?.toLowerCase().includes(search) ||
      org.business_id?.toLowerCase().includes(search)
    )
  })

  const getStatusBadge = (status: Organization['verification_status'], approved: boolean) => {
    if (approved && status === 'approved') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">Approved</span>
    }
    if (status === 'rejected') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-400/30">Rejected</span>
    }
    if (status === 'email_verified') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">Email Verified</span>
    }
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">Pending</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#004aad]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) return null

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
                className="h-auto w-40 max-w-full select-none"
                priority
              />
            </Link>

            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full border border-white/60 text-sm font-[Marble] hover:bg-white hover:text-[#004aad] transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center text-[#52b2bf] hover:text-[#f77fbe] transition-colors mb-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl mb-2 text-[#f77fbe]">All Organizations</h1>
          <p className="text-lg text-blue-100">Manage all registered organizations</p>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, type, or business ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#f77fbe]"
          />
        </div>

        {/* Stats */}
        <div className="mb-6 bg-white/10 rounded-2xl p-4 border border-white/40">
          <p className="text-lg">
            Total Organizations: <span className="text-[#52b2bf] font-bold">{filteredOrganizations.length}</span>
            {searchTerm && <span className="text-sm ml-2">(filtered from {organizations.length})</span>}
          </p>
        </div>

        {/* Organizations table */}
        <div className="bg-white/10 rounded-3xl border-2 border-white/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-[#003580]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Business ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-blue-200">
                      {searchTerm ? 'No organizations found matching your search.' : 'No organizations registered yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{org.org_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                        {org.org_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                        {org.org_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                        {org.business_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(org.verification_status, org.approved)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteOrganization(org.id)}
                          disabled={actionLoading === org.id}
                          className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === org.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
