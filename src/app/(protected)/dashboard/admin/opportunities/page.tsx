"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"
import Image from "next/image"
import Link from "next/link"

interface Opportunity {
  id: string
  opportunity_name: string
  brief_description: string
  category: string
  opportunity_type: string
  location_type: string
  location_state: string
  application_deadline: string
  cost: number
  is_active: boolean
  created_at: string
  organizations: {
    id: number
    org_name: string
    org_type: string
  }
}

export default function AdminOpportunitiesPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { first_name?: string; last_name?: string; role?: string } } | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
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
      fetchOpportunities()
    }

    checkUser()
  }, [router])

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/admin/opportunities')
      if (response.ok) {
        const data = await response.json()
        setOpportunities(data.opportunities)
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
      return
    }

    setActionLoading(opportunityId)
    try {
      const response = await fetch('/api/admin/opportunities', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ opportunityId })
      })

      if (response.ok) {
        await fetchOpportunities()
      } else {
        alert('Failed to delete opportunity')
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error)
      alert('Error deleting opportunity')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  const filteredOpportunities = opportunities.filter(opp => {
    const search = searchTerm.toLowerCase()
    return (
      opp.opportunity_name?.toLowerCase().includes(search) ||
      opp.brief_description?.toLowerCase().includes(search) ||
      opp.category?.toLowerCase().includes(search) ||
      opp.opportunity_type?.toLowerCase().includes(search) ||
      opp.organizations?.org_name?.toLowerCase().includes(search)
    )
  })

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
          <h1 className="text-4xl md:text-5xl mb-2 text-[#f77fbe]">All Opportunities</h1>
          <p className="text-lg text-blue-100">Manage all posted opportunities</p>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, description, category, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#f77fbe]"
          />
        </div>

        {/* Stats */}
        <div className="mb-6 bg-white/10 rounded-2xl p-4 border border-white/40">
          <p className="text-lg">
            Total Opportunities: <span className="text-[#52b2bf] font-bold">{filteredOpportunities.length}</span>
            {searchTerm && <span className="text-sm ml-2">(filtered from {opportunities.length})</span>}
          </p>
        </div>

        {/* Opportunities grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOpportunities.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white/10 rounded-3xl border-2 border-white/40">
              <p className="text-blue-200 text-lg">
                {searchTerm ? 'No opportunities found matching your search.' : 'No opportunities posted yet.'}
              </p>
            </div>
          ) : (
            filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white/10 rounded-3xl border-2 border-white/40 p-6 hover:bg-white/15 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#f77fbe] mb-2">{opp.opportunity_name}</h3>
                    <p className="text-sm text-[#52b2bf] mb-1">
                      by {opp.organizations?.org_name || 'Unknown Organization'}
                    </p>
                  </div>
                  <div className="ml-4">
                    {opp.is_active ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-400/30">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-blue-100 mb-4 line-clamp-2">{opp.brief_description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm text-blue-200 mb-4">
                  <div>
                    <span className="text-[#52b2bf] font-medium">Category:</span> {opp.category}
                  </div>
                  <div>
                    <span className="text-[#52b2bf] font-medium">Type:</span> {opp.opportunity_type}
                  </div>
                  <div>
                    <span className="text-[#52b2bf] font-medium">Location:</span> {opp.location_type}
                  </div>
                  <div>
                    <span className="text-[#52b2bf] font-medium">State:</span> {opp.location_state || 'N/A'}
                  </div>
                  <div>
                    <span className="text-[#52b2bf] font-medium">Cost:</span> ${opp.cost ? opp.cost.toFixed(2) : '0.00'}
                  </div>
                  <div>
                    <span className="text-[#52b2bf] font-medium">Deadline:</span>{' '}
                    {new Date(opp.application_deadline).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/20">
                  <span className="text-xs text-blue-300">
                    Posted: {new Date(opp.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteOpportunity(opp.id)}
                    disabled={actionLoading === opp.id}
                    className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === opp.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
