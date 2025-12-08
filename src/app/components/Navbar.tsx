"use client"

import { useAuth } from "@/app/components/Providers"
import { supabase } from "@/app/lib/supabaseClient"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

export default function Navbar() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  // Don't show navbar on auth pages, org registration, or org dashboard (has its own bar) #now student
  if (
    pathname === "/auth" ||
    pathname === "/org" ||
    pathname === "/org/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/dashboard/org") ||
    pathname.startsWith("/dashboard/student")
  ) {
    return null
  }

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path)

  const getActiveClass = (path: string) =>
    isActive(path)
      ? "bg-berryBlue text-white shadow-md"
      : "text-white hover:bg-berryPink hover:shadow-md transition-all"

  // Extract user information from Supabase user object
  const name = user
    ? user.user_metadata?.full_name ||
      [user.user_metadata?.first_name, user.user_metadata?.last_name]
        .filter(Boolean)
        .join(" ") ||
      user.email?.split("@")[0]
    : null

  const userRole = user?.user_metadata?.role

  return (
    <nav className="sticky top-0 z-50 bg-transparent backdrop-blur-md shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
    <span className="font-[Atelia] text-3xl text-[#f77fbe] tracking-wide drop-shadow-md">
      BERRY
    </span>
  </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Public Navigation - Not logged in */}
            {!loading && !user && (
              <>

                {/* Admin – subtle outline */}
                <Link
                  href="/dashboard/admin"
                  className="px-4 py-2 rounded-full text-sm font-[Marble] border border-white/40 text-white hover:bg-white/10 transition-colors"
                >
                  Admin
                </Link>
              </>
            )}

            {/* Authenticated Navigation */}
            {!loading && user && (
              <>
                {/* Dashboard dropdown */}
                <div className="relative group">
                  <button className="px-4 py-2 rounded-full text-sm font-[Marble] bg-white text-berryBlue border border-berryBlue/60 hover:bg-blue-50 transition-all shadow-sm flex items-center">
                    Dashboards
                    <svg
                      className="ml-1 h-4 w-4 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-52 bg-blue-50 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-blue-200">
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm font-[Marble] text-gray-800 hover:bg-berryBlue hover:text-white transition-colors rounded-lg mx-2"
                      >
                        Main Dashboard
                      </Link>
                      <Link
                        href="/dashboard/student"
                        className="block px-4 py-2 text-sm font-[Marble] text-gray-800 hover:bg-berryBlue hover:text-white transition-colors rounded-lg mx-2"
                      >
                        Student Dashboard
                      </Link>
                      <Link
                        href="/dashboard/org"
                        className="block px-4 py-2 text-sm font-[Marble] text-gray-800 hover:bg-berryBlue hover:text-white transition-colors rounded-lg mx-2"
                      >
                        Organization Dashboard
                      </Link>
                      <Link
                        href="/dashboard/admin"
                        className="block px-4 py-2 text-sm font-[Marble] text-gray-800 hover:bg-berryBlue hover:text-white transition-colors rounded-lg mx-2"
                      >
                        Admin Dashboard
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Student-only links */}
                {userRole === "student" && (
                  <Link
                    href="/dashboard/student/student-feed"
                    className={`px-3 py-2 bg-berryBlue rounded-full text-sm font-[Marble] transition-colors ${getActiveClass(
                      "/dashboard/student/student-feed"
                    )}`}
                  >
                    My Feed
                  </Link>
                )}

                {userRole === "student" && (
                  <Link
                    href="/dashboard/student/student-explore"
                    className={`px-3 bg-berryPink py-2 rounded-full text-sm font-[Marble] transition-colors ${getActiveClass(
                      "/dashboard/student/explore"
                    )}`}
                  >
                    Explore
                  </Link>
                )}

                {userRole === "student" && (
                  <Link
                    href="/dashboard/student/student-profile"
                    className={`px-3 py-2 bg-berryBlue rounded-full text-sm font-[Marble] transition-colors ${getActiveClass(
                      "/dashboard/student/profile"
                    )}`}
                  >
                    Profile
                  </Link>
                )}

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <span className="text-white text-sm font-[Marble] bg-berryPink/20 px-3 py-1.5 rounded-full">
                    {name || "User"}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 rounded-full text-sm font-[Marble] bg-berryPink text-white hover:bg-pink-600 transition-all shadow-md shadow-pink-300/40"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-100 hover:text-white focus:outline-none focus:text-white"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#707070]/95 border-t border-white/10">
              {/* Not logged in */}
              {!loading && !user && (
                <>
                  <Link
                    href="/auth?mode=signin"
                    className="block px-3 py-2 rounded-full text-base font-[Marble] bg-white text-[#004aad] border border-[#004aad]/60 hover:bg-blue-50 hover:border-[#004aad] transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    className="block px-3 py-2 rounded-full text-base font-[Marble] bg-[#f77fbe] text-white hover:bg-[#d763a4] transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/org"
                    className="block px-3 py-2 rounded-full text-base font-[Marble] bg-[#004aad] text-white hover:bg-[#00337a] transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Org Registration
                  </Link>
                  <Link
                    href="/dashboard/admin"
                    className="block px-3 py-2 rounded-full text-base font-[Marble] border border-white/40 text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                </>
              )}

              {/* Logged in */}
              {!loading && user && (
                <>
                  <Link
                    href="/dashboard"
                    className={`block px-3 py-2 rounded-full text-base font-[Marble] transition-colors ${getActiveClass(
                      "/dashboard"
                    )}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Main Dashboard
                  </Link>
                  <Link
                    href="/dashboard/student"
                    className={`block px-3 py-2 rounded-full text-base font-[Marble] transition-colors ${getActiveClass(
                      "/dashboard/student"
                    )}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Student Dashboard
                  </Link>
                  <Link
                    href="/dashboard/org"
                    className={`block px-3 py-2 rounded-full text-base font-[Marble] transition-colors ${getActiveClass(
                      "/dashboard/org"
                    )}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Organization Dashboard
                  </Link>
                  <Link
                    href="/dashboard/admin"
                    className={`block px-3 py-2 rounded-full text-base font-[Marble] transition-colors ${getActiveClass(
                      "/dashboard/admin"
                    )}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                  <div className="border-t border-white/15 pt-3 mt-3">
                    <div className="px-3 py-2 text-white text-sm font-[Marble] bg-berryPink/20 rounded-full">
                      {name || "User"}
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-center px-3 py-2 rounded-full text-base font-[Marble] bg-berryPink text-white hover:bg-pink-600 transition-all shadow-md mt-2"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}

              {loading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
