"use client";

import { useEffect, useState, useRef } from "react";
import { FaStar, FaBars, FaSearch } from "react-icons/fa";
import useFavorites from "../../../../../lib/useFavorites";
import Image from "next/image";
import Link from "next/link";


type Opportunity = {
  id: string;
  opportunity_name: string | null;
  brief_description: string | null;
  category: string | null;
  opportunity_type: string | null;
  application_deadline: string | null;
  org_name: string | null;
  min_age?: number | null;
  max_age?: number | null;
  min_gpa?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  requirements_other?: string | null;
  grade_levels?: string[] | null;
  location_type?: string | null;
  application_url?: string | null;
  has_stipend?: boolean | null;
  contact_info?: Record<string, unknown> | null;
};

const BERRY_CATEGORIES = [
  "STEM & Innovation",
  "Arts & Design",
  "Civic Engagement & Leadership",
  "Trades & Technical Careers",
  "Business & Entrepreneurship",
  "Health, Wellness & Environment",
  "Humanities & Social Sciences",
];

export default function StudentExplorePage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  const { favorites, toggleFavorite, isFavorite, loading: favLoading } = useFavorites();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const searchTimeout = useRef<number | null>(null);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailAbortRef = useRef<AbortController | null>(null);
  const [favoritesFirst, setFavoritesFirst] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Get current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });

  const formatCategory = (raw: string | null | undefined) => {
    if (!raw) return "";
    const parts = String(raw).replace(/[_-]+/g, " ").trim().split(/\s+/);
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  };

  const toBool = (v: unknown): boolean | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    const s = String(v).trim().toLowerCase();
    if (["true", "t", "1", "yes", "y"].includes(s)) return true;
    if (["false", "f", "0", "no", "n"].includes(s)) return false;
    return null;
  };

  const load = async (p = 1, currentSearch = search, currentCategory = selectedCategory) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("pageSize", String(pageSize));
      if (currentSearch.trim()) params.set("search", currentSearch.trim());
      if (currentCategory) params.set("category", currentCategory);

      const res = await fetch(`/api/opportunities/student-explore?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message ?? `Request failed: ${res.status}`);
      }
      const json = await res.json();
      setItems(json.data ?? []);
      setPage(json.page ?? p);
      setHasMore((json.data?.length ?? 0) >= pageSize);
    } catch (err) {
      setError((err as Error).message || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      load(1, search, selectedCategory);
    }, 350);
    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory]);

  const goto = (p: number) => {
    if (p < 1) return;
    load(p);
  };

  const openModal = async (o: Opportunity) => {
    if (detailAbortRef.current) {
      detailAbortRef.current.abort();
      detailAbortRef.current = null;
    }
    setSelected(o);
    setDetailLoading(true);
    const ac = new AbortController();
    detailAbortRef.current = ac;
    try {
      const res = await fetch(`/api/opportunities/opportunity-card?id=${encodeURIComponent(o.id)}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      if (!res.ok) {
        setDetailLoading(false);
        return;
      }
      const json = await res.json();
      const details = json.data ?? null;
      if (details) {
        setSelected((prev) => {
          const stipend = toBool(details.has_stipend ?? prev?.has_stipend ?? o.has_stipend);
          return {
            ...(prev ?? o),
            ...details,
            has_stipend: stipend,
          };
        });
      }
    } catch {
      // Silently catch errors
    } finally {
      detailAbortRef.current = null;
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    if (detailAbortRef.current) {
      detailAbortRef.current.abort();
      detailAbortRef.current = null;
    }
    setSelected(null);
  };

  // compute displayed items (only-favorites overrides favorites-first)
  let displayedItems = items;
  if (onlyFavorites) {
    displayedItems = items.filter((it) => isFavorite(it.id));
  } else if (favoritesFirst) {
    displayedItems = [...items].sort((a, b) => (isFavorite(b.id) ? 1 : 0) - (isFavorite(a.id) ? 1 : 0));
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        setMenuOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (menuOpen && !(e.target as HTMLElement).closest('nav')) {
        setMenuOpen(false);
      }
    };
    if (selected) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    } else {
      document.body.style.overflow = "";
    }
    if (menuOpen) {
      window.addEventListener("click", onClick);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [selected, menuOpen]);

  return (
    <div className="min-h-screen bg-[#004aad] font-[Marble]">
      {/* Custom Navigation Bar */}
      <nav className="bg-[#004aad] shadow-lg relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24 py-6">
            {/* Left: Menu Icon, Explore Title, and Filter */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-white text-2xl hover:opacity-80 transition-opacity"
              >
                <FaBars />
              </button>
              <h1 className="text-white text-4xl font-[Marble] font-bold">Explore</h1>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-3xl mx-4">
              <div className="relative">
                <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="search"
                  placeholder="Search by categories, interests, or company name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 text-lg rounded-full bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-berryPink shadow-lg"
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
              href="/dashboard/student/student-feed"
              className="block px-6 py-4 text-white font-[Marble] hover:bg-white/20 transition-all"
              onClick={() => setMenuOpen(false)}
            >
              My Feed
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content: Two-Column Layout */}
      {/* Original padding: py-8 */}
      <div className="pt-16 pb-8 px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Half: Categories */}
          <aside className="bg-[#004aad]/30 p-12">
            <div>
              <h2 className="text-2xl font-[Marble] font-bold text-white mb-10 text-center">Search by Category</h2>

              {/* New layout matching the image */}
              <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                {/* Row 1: STEM & Innovation, Arts & Design */}
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => setSelectedCategory(selectedCategory === BERRY_CATEGORIES[0] ? "" : BERRY_CATEGORIES[0])}
                    className={`text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base transition-all duration-200 text-xl ${
                      selectedCategory === BERRY_CATEGORIES[0]
                        ? "bg-[#52b2bf] text-white shadow-[0_15px_40px_rgba(82,178,191,0.45)] scale-105"
                        : "bg-[#52b2bf] text-white hover:bg-[#00327a] hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)] hover:-translate-y-1"
                    }`}
                  >
                    {BERRY_CATEGORIES[0]}
                  </button>
                  <button
                    onClick={() => setSelectedCategory(selectedCategory === BERRY_CATEGORIES[1] ? "" : BERRY_CATEGORIES[1])}
                    className={`text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base transition-all duration-200 text-xl ${
                      selectedCategory === BERRY_CATEGORIES[1]
                        ? "bg-[#52b2bf] text-white shadow-[0_15px_40px_rgba(82,178,191,0.45)] scale-105"
                        : "bg-[#52b2bf] text-white hover:bg-[#00327a] hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)] hover:-translate-y-1"
                    }`}
                  >
                    {BERRY_CATEGORIES[1]}
                  </button>
                </div>

                {/* Row 2: Civic Engagement & Leadership, Trades & Technical Careers */}
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => setSelectedCategory(selectedCategory === BERRY_CATEGORIES[2] ? "" : BERRY_CATEGORIES[2])}
                    className={`text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base transition-all duration-200 text-xl ${
                      selectedCategory === BERRY_CATEGORIES[2]
                        ? "bg-[#52b2bf] text-white shadow-[0_15px_40px_rgba(82,178,191,0.45)] scale-105"
                        : "bg-[#52b2bf] text-white hover:bg-[#00327a] hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)] hover:-translate-y-1"
                    }`}
                  >
                    {BERRY_CATEGORIES[2]}
                  </button>
                  <button
                    onClick={() => setSelectedCategory(selectedCategory === BERRY_CATEGORIES[3] ? "" : BERRY_CATEGORIES[3])}
                    className={`text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base transition-all duration-200 text-xl ${
                      selectedCategory === BERRY_CATEGORIES[3]
                        ? "bg-[#52b2bf] text-white shadow-[0_15px_40px_rgba(82,178,191,0.45)] scale-105"
                        : "bg-[#52b2bf] text-white hover:bg-[#00327a] hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)] hover:-translate-y-1"
                    }`}
                  >
                    {BERRY_CATEGORIES[3]}
                  </button>
                </div>

                {/* Row 3: Business & Entrepreneurship, Health, Wellness & Environment */}
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => setSelectedCategory(selectedCategory === BERRY_CATEGORIES[4] ? "" : BERRY_CATEGORIES[4])}
                    className={`text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base transition-all duration-200 text-xl ${
                      selectedCategory === BERRY_CATEGORIES[4]
                        ? "bg-[#52b2bf] text-white shadow-[0_15px_40px_rgba(82,178,191,0.45)] scale-105"
                        : "bg-[#52b2bf] text-white hover:bg-[#00327a] hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)] hover:-translate-y-1"
                    }`}
                  >
                    {BERRY_CATEGORIES[4]}
                  </button>
                  <button
                    onClick={() => setSelectedCategory(selectedCategory === BERRY_CATEGORIES[5] ? "" : BERRY_CATEGORIES[5])}
                    className={`text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base transition-all duration-200 text-xl ${
                      selectedCategory === BERRY_CATEGORIES[5]
                        ? "bg-[#52b2bf] text-white shadow-[0_15px_40px_rgba(82,178,191,0.45)] scale-105"
                        : "bg-[#52b2bf] text-white hover:bg-[#00327a] hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)] hover:-translate-y-1"
                    }`}
                  >
                    {BERRY_CATEGORIES[5]}
                  </button>
                </div>

                {/* Row 4: Humanities & Social Sciences - Full Width */}
                <button
                  onClick={() => setSelectedCategory(selectedCategory === BERRY_CATEGORIES[6] ? "" : BERRY_CATEGORIES[6])}
                  className={`text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base transition-all duration-200 text-xl ${
                    selectedCategory === BERRY_CATEGORIES[6]
                      ? "bg-[#52b2bf] text-white shadow-[0_15px_40px_rgba(82,178,191,0.45)] scale-105"
                      : "bg-[#52b2bf] text-white hover:bg-[#00327a] hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)] hover:-translate-y-1"
                  }`}
                >
                  {BERRY_CATEGORIES[6]}
                </button>

                {/* Clear Filter button */}
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory("")}
                    className="text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base bg-white/20 text-white hover:bg-white/30 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(247,127,190,0.35)]"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* OLD LAYOUT - Commented for reference
              <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                {BERRY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                    className={`text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base transition-all duration-200 text-xl ${
                      selectedCategory === cat
                        ? "bg-[#52b2bf] text-white shadow-[0_15px_40px_rgba(82,178,191,0.45)] scale-105"
                        : "bg-[#52b2bf] text-white hover:bg-[#00327a] hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)] hover:-translate-y-1"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory("")}
                    className="col-span-2 text-center px-8 py-6 rounded-2xl font-[Marble] font-bold text-base bg-white/20 text-white hover:bg-white/30 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(247,127,190,0.35)]"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              */}
            </div>
          </aside>

          {/* Right Half: Visuals/Cards */}
          <main className="p-8 bg-[#004aad]">
            <div className="mb-8">
              {/* Title centered with cards */}
              <h2 className="text-3xl font-[Marble] font-bold text-white mb-6 text-center">Visuals</h2>

              {/* Favorites controls - aligned and presentable */}
              <div className="flex items-center justify-between mb-4 ml-8">
                <div className="inline-flex items-center px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-semibold shadow-md">
                  ⭐ {favorites.size} Favorites
                </div>
                <div className="flex items-center gap-6">
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
              </div>

              <p className="text-sm text-white/80 mb-2 ml-8">
                {loading ? "Loading..." : `${displayedItems.length} opportunities shown`}
              </p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}

            {loading && !items.length ? (
              <div className="py-12 text-center text-white/70 text-lg font-[Marble]">Loading opportunities…</div>
            ) : onlyFavorites && displayedItems.length === 0 ? (
              <div className="py-12 text-center text-white bg-white/10 p-8 rounded-2xl border-2 border-white/40 shadow-[0_20px_60px_rgba(82,178,191,0.3)] backdrop-blur font-[Marble]">
                No favorites yet — star an opportunity to save it.
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-white bg-white/10 p-8 rounded-2xl border-2 border-white/40 shadow-[0_20px_60px_rgba(82,178,191,0.3)] backdrop-blur font-[Marble]">
                No opportunities found. Try adjusting your search or category filter.
              </div>
            ) : (
              <>
                {/* Grid of Opportunity Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ml-8">
                  {displayedItems.map((o) => (
                    <article
                      key={o.id}
                      className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden hover:shadow-[0_20px_60px_rgba(247,127,190,0.3)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                      onClick={() => openModal(o)}
                    >
                      {/* Image Placeholder */}
                      <div className="h-56 bg-gradient-to-br from-[#004aad]/30 via-[#52b2bf]/20 to-[#f77fbe]/30 flex items-center justify-center p-6">
                        <div className="text-center">
                          <h3 className="font-[Marble] font-bold text-xl text-gray-800 line-clamp-3">
                            {o.opportunity_name}
                          </h3>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-2">{o.org_name}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{o.brief_description}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs px-3 py-1.5 bg-[#004aad] text-white rounded-full font-[Marble] font-semibold">
                            {o.category ? formatCategory(o.category) : "General"}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(o.id);
                            }}
                            aria-label="Toggle Favorite"
                            className="hover:scale-125 transition-transform"
                          >
                            <FaStar
                              className={`text-xl ${
                                isFavorite(o.id) ? "fill-current text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          </button>
                        </div>

                        {o.application_deadline && (
                          <div className="mt-4 text-xs text-gray-600 font-medium">
                            Deadline: {new Date(o.application_deadline).toLocaleDateString()}
                          </div>
                        )}
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
        </div>
      </div>

      {/* Modal for Opportunity Details */}
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
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Age Range:</strong> {selected.min_age ?? "—"} — {selected.max_age ?? "—"}
                </div>
              )}
              {selected.grade_levels && Array.isArray(selected.grade_levels) && (
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Grades:</strong> {selected.grade_levels.join(", ")}
                </div>
              )}
              {selected.location_type && (
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Location:</strong> {selected.location_type}
                </div>
              )}
              {selected.min_gpa != null && (
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Min GPA:</strong> {Number(selected.min_gpa).toFixed(2).replace(/\.00$/, "")}
                </div>
              )}
              {(selected.start_date || selected.end_date) && (
                <div className="bg-white-50 p-3 rounded-lg">
                  {selected.start_date && <div><strong>Starts:</strong> {new Date(selected.start_date).toLocaleDateString()}</div>}
                  {selected.end_date && <div><strong>Ends:</strong> {new Date(selected.end_date).toLocaleDateString()}</div>}
                </div>
              )}
              {selected.has_stipend != null && (
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Stipend:</strong> {selected.has_stipend ? "Yes" : "No"}
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
  );
}
