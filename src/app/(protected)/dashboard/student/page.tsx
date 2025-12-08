"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabaseClient"

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth?mode=signin")
        return
      }

      // Verify user has the correct role
      const userRole = session.user.user_metadata?.role
      if (userRole !== 'student') {
        // If not a student, redirect to appropriate dashboard
        router.push(userRole === 'org' ? '/dashboard/org' : '/dashboard')
        return
      }

      setUser(session.user)

      // Fetch student profile
      try {
        const res = await fetch(
          `/api/student-profile?userId=${encodeURIComponent(session.user.id)}`,
          { cache: "no-store" }
        )
        if (res.ok) {
          const json = await res.json()
          setProfile(json.profile ?? {})
        }
      } catch (e) {
        console.error("Failed to load profile", e)
      }

      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#004aad]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#004aad] text-white font-[Marble] overflow-x-hidden">
      {/* Top bar – BERRY + Sign Out */}
      <nav>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/dashboard/student"
              className="flex items-center"
            >
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

      <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl mb-4 text-center">
          Welcome back,{" "}
          <span className="text-[#f77fbe]">
            {user.user_metadata?.first_name || user.email}
          </span>
          !
        </h2>

        {/* Quick actions */}
        <section className="card mb-12 rounded-3xl bg-white/10 border-2 border-white/40 shadow-[0_30px_80px_rgba(82,178,191,0.35)] px-8 py-8 backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_35px_90px_rgba(247,127,190,0.35)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Browse opportunities */}
            <button
              onClick={() => router.push("/dashboard/student/student-explore")}
              className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[#004aad] border border-white/30 hover:bg-[#00327a] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)]"
            >
              <svg
                className="h-12 w-12 text-[#52b2bf] mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-lg font-[Marble]">EXPLORE!</span>
            </button>

            {/* My Applications */}
            <button
              onClick={() => router.push("/dashboard/student/student-feed")}
              className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[#004aad] border border-white/30 hover:bg-[#00327a] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)]"
            >
              <svg
                className="h-12 w-12 text-[#f77fbe] mb-3"
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
              <span className="text-lg font-[Marble]">My Feed</span>
            </button>

            {/* Account settings */}
            <button
              onClick={() => router.push("/dashboard/student/student-profile")}
              className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[#004aad] border border-white/30 hover:bg-[#00327a] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(82,178,191,0.45)]"
            >
              <svg
                className="h-12 w-12 text-purple-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-lg font-[Marble]">Profile Settings</span>
            </button>
          </div>
        </section>

        {/* User Information card */}
        <section className="card rounded-3xl border-2 border-white/40 bg-[#004aad] shadow-[0_24px_60px_rgba(82,178,191,0.25)] overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(247,127,190,0.3)] px-8 py-8">
          <h3 className="text-3xl font-[Marble] mb-6">Profile Summary</h3>
          <div className="space-y-4 text-lg">
            <div className="flex items-center">
              <span className="text-[#52b2bf] font-[Marble] w-32">Name:</span>
              <span className="text-blue-50">
                {(profile?.first_name || profile?.last_name)
                  ? `${profile?.first_name || user.user_metadata?.first_name || ""} ${profile?.last_name || user.user_metadata?.last_name || ""}`.trim()
                  : (user.user_metadata?.first_name || user.user_metadata?.last_name)
                    ? `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim()
                    : "—"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-[#52b2bf] font-[Marble] w-32">Email:</span>
              <span className="text-blue-50">{user.email || "—"}</span>
            </div>
            <div className="flex items-center">
              <span className="text-[#52b2bf] font-[Marble] w-32">DOB:</span>
              <span className="text-blue-50">{profile?.date_of_birth || "—"}</span>
            </div>
            <div className="flex items-center">
              <span className="text-[#52b2bf] font-[Marble] w-32">School:</span>
              <span className="text-blue-50">{profile?.school || "—"}</span>
            </div>
            <div className="flex items-center">
              <span className="text-[#52b2bf] font-[Marble] w-32">Grade:</span>
              <span className="text-blue-50">{profile?.grade_level || "—"}</span>
            </div>
            <div className="flex items-center">
              <span className="text-[#52b2bf] font-[Marble] w-32">GPA:</span>
              <span className="text-blue-50">{profile?.gpa != null ? profile.gpa : "—"}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )

  {/* OLD STYLING - Commented out for reference
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.user_metadata?.first_name || user.email}
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
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Student Dashboard
              </h2>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  User Information
                </h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {user.user_metadata?.first_name} {user.user_metadata?.last_name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
  */}
}