"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"

interface Opportunity {
  id: string
  opportunity_name: string
  category: string
  opportunity_type: string
  brief_description: string
  location_type: string
  location_address: string | null
  location_state: string | null
  cost: number
  has_stipend: boolean
  application_deadline: string
  application_url: string
  is_active: boolean
  created_at: string
  start_date: string | null
  end_date: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  stem_innovation: "STEM & Innovation",
  arts_design: "Art & Design",
  humanities_social_sciences: "Humanities & Social Sciences",
  civic_engagement_leadership: "Civic Engagement & Leadership",
  health_sports_sustainability: "Health, Sports & Sustainability",
  business_entrepreneurship: "Business & Entrepreneurship",
  trades_technical: "Trade & Technical Careers",
}

const TYPE_LABELS: Record<string, string> = {
  program: "Program",
  summer_opportunity: "Summer Opportunity",
  internship: "Internship",
  mentorship: "Mentorship",
  volunteering: "Volunteering",
}

export default function MyOpportunitiesPage() {
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [opportunityToDelete, setOpportunityToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMyOpportunities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchMyOpportunities = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth?mode=signin")
        return
      }

      const { data, error: fetchError } = await supabase
        .from("opportunities")
        .select("*")
        .eq("created_by", session.user.id)
        .order("created_at", { ascending: false })

      if (fetchError) throw new Error(fetchError.message)

      setOpportunities(data || [])
    } catch (err) {
      console.error("Error fetching opportunities:", err)
      setError(err instanceof Error ? err.message : "Failed to load opportunities")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (opportunityId: string) => {
    setOpportunityToDelete(opportunityId)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!opportunityToDelete) return

    try {
      setDeleting(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) throw new Error("You must be signed in")

      const response = await fetch(`/api/opportunities?id=${opportunityToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to delete opportunity")
      }

      await fetchMyOpportunities()
      setDeleteModalOpen(false)
      setOpportunityToDelete(null)
    } catch (err) {
      console.error("Error deleting opportunity:", err)
      setError(err instanceof Error ? err.message : "Failed to delete opportunity")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isDeadlinePassed = (deadline: string) =>
    new Date(deadline) < new Date()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-[Marble] bg-[#004aad] text-white">
        <div
          className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#004aad] text-white font-[Marble]">
      <nav>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard/org" className="flex items-center">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header */}
        <header className="mb-8 flex flex-col items-center text-center gap-3 w-full">
          <div className="grid w-full max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-6">
            <button
              onClick={() => router.push("/dashboard/org")}
              className="p-2 rounded-full border border-white/40 text-white hover:bg-white hover:text-[#004aad] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(247,127,190,0.45)]"
              aria-label="Back to dashboard"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-3xl md:text-4xl font-[Marble] font-normal text-white text-center">
              My Posted Opportunities
            </h1>
            <button
              onClick={() => router.push("/dashboard/org/post-opportunity")}
              className="w-11 h-11 rounded-full bg-[#f77fbe] text-[#004aad] text-2xl font-semibold flex items-center justify-center border border-white/40 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(247,127,190,0.45)] hover:bg-[#f992c8]"
              aria-label="Post new opportunity"
            >
              +
            </button>
          </div>
          <p className="text-sm text-blue-100 whitespace-nowrap">
            View, update, or retire opportunities that your organization has shared with students.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 border border-red-300/70 bg-red-500/10 rounded-xl px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {/* Empty state */}
        {opportunities.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-white/40 px-8 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-base font-semibold text-white">
              No opportunities yet
            </h3>
            <p className="mt-1 text-sm text-blue-100 max-w-md mx-auto">
              Post your first opportunity to start reaching students.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/dashboard/org/post-opportunity")}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-[#f77fbe] text-white border border-white/20 hover:bg-[#f992c8] transition-colors shadow-md"
              >
                Post a new opportunity
              </button>
            </div>
          </div>
        ) : (
          <section className="space-y-4">
            {opportunities.map((opp) => {
              const categoryLabel =
                CATEGORY_LABELS[opp.category] ?? "Other"
              const typeLabel =
                TYPE_LABELS[opp.opportunity_type] ?? "Opportunity"

              const statusLabel = !opp.is_active
                ? "Deleted"
                : isDeadlinePassed(opp.application_deadline)
                ? "Deadline passed"
                : "Active"

              const statusClasses = !opp.is_active
                ? "bg-white/10 text-white"
                : isDeadlinePassed(opp.application_deadline)
                ? "bg-amber-200/20 text-amber-100"
                : "bg-emerald-200/20 text-emerald-100"

              return (
                <article
                  key={opp.id}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/40 shadow-[0_20px_60px_rgba(82,178,191,0.25)] hover:shadow-[0_24px_70px_rgba(247,127,190,0.35)] transition-transform duration-200 hover:-translate-y-1 px-5 py-5 sm:px-7 sm:py-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Left section: title + chips + description + meta */}
                    <div className="flex-1">
                      {/* Title + status */}
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h2 className="text-lg font-[Marble] font-normal text-white">
                          {opp.opportunity_name}
                        </h2>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-[Marble] font-normal tracking-wide ${statusClasses}`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Chips */}
                      <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
                        <span className="inline-flex items-center rounded-full bg-white/15 text-white px-2.5 py-0.5 font-medium">
                          {categoryLabel}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[#f77fbe]/20 text-white px-2.5 py-0.5 font-medium">
                          {typeLabel}
                        </span>
                      </div>

                      {/* Description */}
                      {opp.brief_description && (
                        <p className="text-sm text-blue-100 mb-4 line-clamp-2">
                          {opp.brief_description}
                        </p>
                      )}

                      {/* Meta grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px] sm:text-[13px] text-blue-100">
                        <div>
                          <p className="uppercase tracking-wide text-[10px] text-white/70">
                            Location
                          </p>
                          <p className="mt-0.5 font-medium text-white capitalize">
                            {opp.location_type === "in_person"
                              ? "In-person"
                              : opp.location_type === "online"
                              ? "Online"
                              : "Hybrid"}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase tracking-wide text-[10px] text-white/70">
                            Cost
                          </p>
                          <p className="mt-0.5 font-medium text-white">
                            {opp.cost === 0 ? "Free" : `$${opp.cost}`}
                            {opp.has_stipend && (
                              <span className="ml-1 text-emerald-200">
                                (+ stipend)
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase tracking-wide text-[10px] text-white/70">
                            Deadline
                          </p>
                          <p
                            className={`mt-0.5 font-medium ${
                              isDeadlinePassed(opp.application_deadline)
                                ? "text-amber-200"
                                : "text-white"
                            }`}
                          >
                            {formatDate(opp.application_deadline)}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase tracking-wide text-[10px] text-white/70">
                            Posted
                          </p>
                          <p className="mt-0.5 font-medium text-white">
                            {formatDate(opp.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {opp.is_active && (
                      <div className="flex sm:flex-col items-start gap-2 sm:ml-2">
                        <button
                          onClick={() =>
                            window.open(opp.application_url, "_blank")
                          }
                          className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                          title="View application link"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/org/my-opportunities/edit/${opp.id}`,
                            )
                          }
                          className="p-2 rounded-lg text-emerald-200 hover:bg-emerald-200/10 transition-colors"
                          title="Edit opportunity"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(opp.id)}
                          className="p-2 rounded-lg text-rose-200 hover:bg-rose-200/10 transition-colors"
                          title="Delete opportunity"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {/* Delete modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-[#004aad] text-white border-2 border-white/40 rounded-2xl p-8 max-w-md w-full shadow-xl font-[Marble]">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-200/20 mb-4">
                  <svg
                    className="h-6 w-6 text-rose-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Delete opportunity?
                </h3>
                <p className="text-sm text-blue-100 mb-6">
                  Students will no longer be able to see or apply to this opportunity. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false)
                      setOpportunityToDelete(null)
                    }}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 border border-white/60 rounded-lg text-sm font-medium text-white hover:bg-white hover:text-[#004aad] transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition disabled:bg-white/40"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
