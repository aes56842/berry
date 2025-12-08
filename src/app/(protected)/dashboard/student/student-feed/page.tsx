'use client'

import { useEffect, useRef, useState } from "react"
import { FaStar, FaBookmark, FaBars, FaFilter } from "react-icons/fa"
import useFavorites from "../../../../../lib/useFavorites"
import Image from "next/image"
import Link from "next/link"

type Opportunity = {
  id: string
  opportunity_name: string
  brief_description: string | null
  category: string | null
  opportunity_type: string | null
  application_deadline: string | null
  org_name: string | null

  // optional detailed fields fetched on demand
  min_age?: number | null
  max_age?: number | null
  min_gpa?: number | null
  start_date?: string | null
  end_date?: string | null
  requirements_other?: string | null
  grade_levels?: string[] | null
  detailed_description?: string | null
  location_type?: string | null
  application_url?: string | null
  has_stipend?: boolean | null
  contact_info?: Record<string, unknown> | null
}

export default function StudentFeedPage() {
  const [items, setItems] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [hasMore, setHasMore] = useState(true)
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const [favoritesFirst, setFavoritesFirst] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // modal state + detail fetch
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const detailAbortRef = useRef<AbortController | null>(null)

  // Get current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  })

  // small helper to call load with correct page
  const load = async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/opportunities/student-feed?page=${p}&pageSize=${pageSize}`, {
        cache: 'no-store'
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.message ?? `Request failed: ${res.status}`)
      }
      const json = await res.json()
      setItems(json.data ?? [])
      setPage(json.page ?? p)
      setHasMore((json.data?.length ?? 0) >= pageSize)
    } catch (err) {
      console.error("Error loading feed:", err)
      setError((err as Error).message || "Failed to load feed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goto = (p: number) => {
    if (p < 1) return
    load(p)
  }

  // open modal immediately with existing data, then fetch details and merge
  const openModal = async (o: Opportunity) => {
    // cancel any previous detail fetch
    if (detailAbortRef.current) {
      detailAbortRef.current.abort()
      detailAbortRef.current = null
    }

    setSelected(o)
    setDetailLoading(true)

    const ac = new AbortController()
    detailAbortRef.current = ac

    try {
      const res = await fetch(`/api/opportunities/opportunity-card?id=${encodeURIComponent(o.id)}`, {
        cache: "no-store",
        signal: ac.signal,
      })
      if (!res.ok) {
        setDetailLoading(false)
        return
      }
      const json = await res.json()
      const details = json.data ?? null
      if (details) {
        setSelected((prev) => {
          // merge details into existing selected object; stipend kept as returned (boolean expected)
          return {
            ...(prev ?? o),
            ...details,
            has_stipend: details.has_stipend ?? prev?.has_stipend ?? o.has_stipend,
          } as Opportunity
        })
      }
    } catch (e) {
      if ((e as Error & { name?: string })?.name !== "AbortError") console.error("Failed to load opportunity details", e)
    } finally {
      detailAbortRef.current = null
      setDetailLoading(false)
    }
  }

  const closeModal = () => {
    // cancel pending fetch
    if (detailAbortRef.current) {
      detailAbortRef.current.abort()
      detailAbortRef.current = null
    }
    setSelected(null)
  }

  // handle Escape and body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal()
        setMenuOpen(false)
      }
    }
    const onClick = (e: MouseEvent) => {
      if (menuOpen && !(e.target as HTMLElement).closest('nav')) {
        setMenuOpen(false)
      }
    }
    if (selected) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", onKey)
    } else {
      document.body.style.overflow = ""
    }
    if (menuOpen) {
      window.addEventListener("click", onClick)
    }
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("click", onClick)
    }
  }, [selected, menuOpen])

  let displayedItems = items
  if (onlyFavorites) {
    displayedItems = items.filter((it) => isFavorite(it.id))
  } else if (favoritesFirst) {
    displayedItems = [...items].sort((a, b) => (isFavorite(b.id) ? 1 : 0) - (isFavorite(a.id) ? 1 : 0))
  }

  // Helper function to get border color based on index
  const getBorderColor = (index: number) => {
    const colors = ['border-l-green-500', 'border-l-orange-500', 'border-l-red-500']
    return colors[index % colors.length]
  }

  return (
    <div className="min-h-screen bg-[#004aad] text-white font-[Marble] overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="bg-[#004aad] shadow-lg relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24 py-6">
            {/* Left: Menu Icon */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-white text-2xl hover:opacity-80 transition-opacity"
              >
                <FaBars />
              </button>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search by categories, interests, or company name"
                  className="w-full px-6 py-4 text-base rounded-full bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f77fbe] shadow-lg"
                />
              </div>
            </div>

            {/* Right: Berry Logo and Date */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0 self-center mt-2">
              <Link
                href="/dashboard/student/student-profile"
                className="bg-[#f77fbe] p-3 rounded-2xl hover:shadow-[0_0_20px_rgba(247,127,190,0.8)] transition-all duration-200 hover:scale-105"
                >
                <Image
                  src="/logos/berry-caterpillar.png"
                  alt="BERRY logo"
                  width={100}
                  height={100}
                  className="h-8 w-8 select-none"
                  priority
                  />
                  </Link>
                  <div className="text-white text-xs font-semibold">{currentDate}</div>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute top-full left-4 mt-2 w-64 bg-white/10 backdrop-blur-lg border-2 border-white/40 rounded-2xl shadow-[0_20px_60px_rgba(82,178,191,0.4)] z-50 overflow-hidden">
            <Link
              href="/dashboard/student"
              className="block px-6 py-4 text-white font-[Marble] hover:bg-white/20 transition-all border-b border-white/20"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/student/student-explore"
              className="block px-6 py-4 text-white font-[Marble] hover:bg-white/20 transition-all"
              onClick={() => setMenuOpen(false)}
            >
              Explore Page
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          {/* Left: My Feed + Quick Filter */}
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-white">My Feed</h1>
            <button className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <FaFilter className="text-xl" />
              <span className="text-lg">Quick Filter</span>
            </button>
          </div>

          {/* Right: Like & Save Options */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white font-bold text-lg mb-1">Like & Save Options</div>
              <div className="text-white/80 text-sm">Easily organize your desired opportunities</div>
            </div>
            <div className="flex items-center gap-3">
              <FaStar className="text-yellow-400 text-2xl" />
              <FaBookmark className="text-white text-2xl" />
            </div>
          </div>
        </div>

        {/* Favorites Controls */}
        <div className="mb-6 flex items-center gap-6">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-semibold shadow-md">
            ⭐ {favorites.size} Favorites
          </div>
          <label className="inline-flex items-center text-sm text-white cursor-pointer bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all">
            <input
              type="checkbox"
              checked={favoritesFirst}
              onChange={(e) => setFavoritesFirst(e.target.checked)}
              className="mr-2"
            />
            Favorites first
          </label>
          <label className="inline-flex items-center text-sm text-white cursor-pointer bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all">
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
              className="mr-2"
            />
            Only favorites
          </label>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}

        {loading && !items.length ? (
          <div className="py-12 text-center text-white/70 text-lg">Loading feed…</div>
        ) : onlyFavorites && displayedItems.length === 0 ? (
          <div className="py-12 text-center text-white bg-white/10 p-8 rounded-2xl border-2 border-white/40 shadow-[0_20px_60px_rgba(82,178,191,0.3)] backdrop-blur">
            You haven&apos;t favorited anything yet — star an opportunity to save it.
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-white bg-white/10 p-8 rounded-2xl border-2 border-white/40 shadow-[0_20px_60px_rgba(82,178,191,0.3)] backdrop-blur">
            No opportunities match your preferences yet.
          </div>
        ) : (
          <>
            {/* Grid of Opportunity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedItems.map((o, index) => (
                <article
                  key={o.id}
                  className={`bg-gradient-to-r from-[#5b8def] to-[#6b9aff] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden hover:shadow-[0_20px_60px_rgba(247,127,190,0.3)] hover:-translate-y-1 transition-all duration-200 cursor-pointer border-l-8 ${getBorderColor(index)}`}
                  onClick={() => openModal(o)}
                >
                  <div className="p-5">
                    {/* Top Section: Org Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Org Logo Placeholder */}
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-bold text-gray-800">
                            {o.org_name?.charAt(0) || 'O'}
                          </span>
                        </div>

                        {/* Org Details */}
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-sm mb-1">{o.org_name || 'Organization'}</h3>
                          <div className="text-white/90 text-xs mb-1">{o.location_type || 'Location TBD'}</div>
                          {o.application_deadline && (
                            <div className="text-white/80 text-xs">
                              Deadline: {new Date(o.application_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Star and Bookmark Icons */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(o.id)
                          }}
                          aria-label="Toggle Favorite"
                          className="hover:scale-125 transition-transform"
                        >
                          <FaStar
                            className={`text-xl ${
                              isFavorite(o.id) ? "fill-current text-yellow-400" : "text-white/50"
                            }`}
                          />
                        </button>
                        <FaBookmark className="text-white/50 text-xl" />
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/30 my-3"></div>

                    {/* Bottom Section: Opportunity Info */}
                    <div>
                      <h4 className="font-bold text-white text-lg mb-2">{o.opportunity_name}</h4>
                      {(o.start_date || o.end_date) && (
                        <div className="text-white/90 text-sm mb-2">
                          {o.start_date && new Date(o.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          {o.start_date && o.end_date && ' - '}
                          {o.end_date && new Date(o.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </div>
                      )}
                      <div className="text-white/70 text-xs">
                        Posted recently
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <button
                onClick={() => goto(page - 1)}
                disabled={loading || page === 1}
                className="px-6 py-2 bg-[#52b2bf] text-white rounded-full font-[Marble] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00327a] hover:shadow-[0_8px_20px_rgba(82,178,191,0.4)] transition-all duration-200 hover:-translate-y-0.5"
              >
                Prev
              </button>
              <span className="text-sm text-white font-[Marble] font-medium">Page {page}</span>
              <button
                onClick={() => goto(page + 1)}
                disabled={loading || !hasMore}
                className="px-6 py-2 bg-[#52b2bf] text-white rounded-full font-[Marble] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00327a] hover:shadow-[0_8px_20px_rgba(82,178,191,0.4)] transition-all duration-200 hover:-translate-y-0.5"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>

      {/* Modal overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selected.opportunity_name}</h3>
                {selected.org_name && <div className="text-sm text-gray-600 mt-1">{selected.org_name}</div>}
              </div>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700 leading-relaxed">
              {selected.brief_description ?? "No description provided."}
            </div>

            {detailLoading && <div className="mt-3 text-sm text-gray-500">Loading additional details…</div>}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              {(selected.min_age || selected.max_age) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Age Range:</strong> {selected.min_age ?? "—"} — {selected.max_age ?? "—"}
                </div>
              )}
              {selected.grade_levels && Array.isArray(selected.grade_levels) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Grades:</strong> {selected.grade_levels.join(", ")}
                </div>
              )}
              {selected.location_type && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Location:</strong> {selected.location_type}
                </div>
              )}
              {selected.min_gpa != null && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Min GPA:</strong> {Number(selected.min_gpa).toFixed(2).replace(/\.00$/, "")}
                </div>
              )}
              {(selected.start_date || selected.end_date) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  {selected.start_date && <div><strong>Starts:</strong> {new Date(selected.start_date).toLocaleDateString()}</div>}
                  {selected.end_date && <div><strong>Ends:</strong> {new Date(selected.end_date).toLocaleDateString()}</div>}
                </div>
              )}
              {(selected.has_stipend === true || selected.has_stipend === false) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Stipend:</strong> {selected.has_stipend === true ? "Yes" : "No"}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-[Marble] hover:bg-gray-300 transition-all duration-200 hover:shadow-md"
              >
                Close
              </button>
              <a
                href={selected.application_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2 bg-[#f77fbe] text-white rounded-full font-[Marble] font-medium hover:bg-[#f77fbe]/90 hover:shadow-[0_8px_20px_rgba(247,127,190,0.4)] transition-all duration-200"
              >
                Apply Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
