"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/components/Providers"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect logged-in users by role
  useEffect(() => {
    if (loading) return
    if (!user) return

    const role = user.user_metadata?.role

    if (role === "org") {
      router.replace("/dashboard/org")
    } else if (role === "student") {
      router.replace("/dashboard/student")
    } else {
      router.replace("/dashboard")
    }
  }, [user, loading, router])

  // While auth is loading → simple centered spinner
  if (loading) {
    return (
      <div className="relative flex-1 flex flex-col bg-[#707070]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#8c8c8c_0,_#707070_40%,_#3f3f3f_100%)] opacity-90" />
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
        </div>
      </div>
    )
  }

  // If user exists we’re redirecting → render nothing
  if (user) return null

  // Not logged in → branded welcome page
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#004aad]">
      <div className="pointer-events-none absolute inset-0 bg-[#004aad] opacity-90" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          {/* LEFT: 3D collage logo only */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            {/* Bigger, more spread-out collage – hidden on very small screens */}
            <div className="relative hidden sm:block w-[740px] h-[520px]">
              {/* Base blocks */}
              <Image
                src="/logos/clearbuilding.png"
                alt="Blocks"
                width={400}
                height={290}
                className="absolute bottom-0 left-10 drop-shadow-[0_14px_35px_rgba(0,0,0,0.35)]"
              />

              {/* iPad + easel */}
              <Image
                src="/logos/3D Ipad and Easel.png"
                alt="Creative tools"
                width={400}
                height={310}
                className="absolute left-[-20px] top-40 drop-shadow-[0_14px_35px_rgba(0,0,0,0.35)]"
              />

              {/* Globe + briefcase */}
              <Image
                src="/logos/BusinessGlobe_clear.png"
                alt="Global opportunities"
                width={310}
                height={310}
                className="absolute left-32 top-[-10px] drop-shadow-[0_14px_35px_rgba(0,0,0,0.3)]"
              />

              {/* Microscope */}
              <Image
                src="/logos/Microscope_clearbackground.png"
                alt="Microscope"
                width={290}
                height={310}
                className="absolute right-[-20px] top-32 drop-shadow-[0_14px_35px_rgba(0,0,0,0.35)]"
              />

              {/* Rulers */}
              <Image
                src="/logos/rulers_3D.png"
                alt="Rulers"
                width={250}
                height={250}
                className="absolute left-[-10px] bottom-0 drop-shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
              />

              {/* Typewriter */}
              <Image
                src="/logos/typewriter.png"
                alt="Typewriter"
                width={290}
                height={270}
                className="absolute left-16 top-24 drop-shadow-[0_12px_30px_rgba(0,0,0,0.32)]"
              />
            </div>
          </div>

          {/* RIGHT: Hero text + CTAs + cards */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            {/* Hero text */}
            <h1 className="text-5xl sm:text-6xl mb-4 text-white">
              Welcome to{" "}
              <span className="font-[Atelia] text-[#f77fbe]">
                Berry
              </span>
            </h1>

            <p className="text-lg sm:text-2xl text-gray-300 mb-8 max-w-xl md:max-w-none mx-auto md:mx-0">
              A secure platform for students and organizations. Sign in with
              your authorized email to get started.
            </p>

            {/* Divider */}
            <div className="w-full border-b border-white/15 mb-8" />

            {/* Top CTA buttons */}
            <div className="flex gap-4 justify-center md:justify-start items-center flex-col sm:flex-row mb-10">
              {/* Primary: Student Sign Up (blue) */}
              <Link
                href="/auth?mode=signup"
                className="rounded-full border border-transparent transition-all flex items-center justify-center bg-[#52b2bf] text-white gap-2 hover:bg-[#00337a] shadow-lg shadow-blue-900/30 font-[Marble] text-sm sm:text-base h-12 px-8 sm:w-auto"
              >
                Student Sign Up
              </Link>

              {/* Secondary: Student Sign In (white) */}
              <Link
                href="/auth?mode=signin"
                className="rounded-full border border-[#004aad]/60 transition-all flex items-center justify-center bg-white text-[#004aad] gap-2 hover:bg-[#00337a] hover:text-white font-[Marble] text-sm sm:text-base h-12 px-8 sm:w-auto"
              >
                Student Sign In
              </Link>

              {/* Org: pink accent */}
              <Link
                href="/org/login"
                className="rounded-full border border-transparent transition-all flex items-center justify-center bg-[#f77fbe] text-white gap-2 hover:bg-[#d763a4] shadow-lg shadow-pink-300/40 font-[Marble] text-sm sm:text-base h-12 px-8 sm:w-auto"
              >
                Organization Sign In
              </Link>
            </div>

            {/* Cards section */}
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto md:mx-0">
              {/* Students card – blue */}
              <div className="bg-[#52b2bf] p-6 rounded-2xl shadow-xl shadow-blue-900/30 transition-transform hover:-translate-y-1 hover:shadow-2xl">
                <div className="text-white mb-4">
                  <svg
                    className="w-8 h-8 mx-auto md:mx-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-[Marble] text-white mb-2">
                  For Students
                </h3>
                <p className="text-sm sm:text-base text-blue-100 font-[Marble]">
                  Access student resources, join organizations, and manage your
                  academic life in one place.
                </p>
              </div>

              {/* Orgs card – pink */}
              <div className="bg-[#f77fbe] p-6 rounded-2xl shadow-xl shadow-pink-300/40 transition-transform hover:-translate-y-1 hover:shadow-2xl">
                <div className="text-white mb-4">
                  <svg
                    className="w-8 h-8 mx-auto md:mx-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-[Marble] text-white mb-2">
                  For Organizations
                </h3>
                <p className="text-sm sm:text-base text-pink-50 mb-4 font-[Marble]">
                  Post enrichment opportunities, manage applicants, and keep
                  everything organized for your team.
                </p>
                <div className="space-y-2">
                  <Link
                    href="/org/login"
                    className="inline-flex items-center text-sm font-[Marble] text-white hover:text-[#004aad]"
                  >
                    Organization Sign In
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                  <br />
                  <Link
                    href="/org"
                    className="inline-flex items-center text-sm font-[Marble] text-white hover:text-[#004aad]"
                  >
                    Register Your Organization
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom divider + lock text */}
            <div className="w-full border-t border-white/15 mt-10 pt-4">
              <div className="mt-4 text-xs sm:text-sm font-[Marble] text-gray-300">
                🔒 Secure access with authorized email authentication{" "}
                <span className="text-gray-200">(@lausd.net)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
