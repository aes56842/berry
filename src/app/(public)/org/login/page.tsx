"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";

export default function OrgLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const role = session.user.user_metadata?.role;
        if (role === "org") {
          router.push("/dashboard/org");
        } else {
          // If they're logged in but not as an org, sign them out
          await supabase.auth.signOut();
        }
      }
    };
    checkSession();
  }, [router]);

  const handleOrgSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!email) {
        throw new Error("Please enter your email address");
      }

      // Only allow organization emails (optional validation)
      if (!email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          shouldCreateUser: false, // Don't create new users here - orgs must register first
        },
      });

      if (signInError) throw signInError;

      // Show confirmation
      setEmailSent(true);
    } catch (err) {
      console.error("Organization sign-in error:", err);
      setError((err as Error).message || "Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#004aad] py-12 px-4 sm:px-6 lg:px-8">
      {/* Make Marble the default font for everything inside */}
      <div className="max-w-md w-full space-y-8 text-white font-[Marble]">
        {/* HEADER: Welcome Back + Berry logo */}
        <div className="relative mb-8">
          <p className="absolute -top-7 left-0 text-2xl sm:text-3xl text-[#f77fbe] font-[Marble] -rotate-12">
            Welcome Back!
          </p>
          <h1 className="text-center text-5xl sm:text-6xl font-[Atelia] tracking-[0.25em] text-[#f77fbe]">
            BERRY
          </h1>
        </div>

        {/* Main heading / subheading */}
        <div>
          <h2 className="mt-4 text-center text-4xl font-[Marble] text-white">
            Organization Login
          </h2>
          <p className="mt-3 text-center text-lg font-[Marble] text-blue-100">
            Access your organization dashboard
          </p>
          <p className="mt-1 text-center text-sm sm:text-base font-[Marble]text-blue-100">
            Only registered organizations can access this portal
          </p>
        </div>

        {emailSent ? (
          <div className="bg-white/10 border border-white/30 p-6 rounded-lg shadow-md">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-green-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h3 className="mt-3 text-2xl font-[Marble] text-white">
                Check your email
              </h3>
              <p className="mt-2 text-base text-blue-100 font-[Marble]">
                We&apos;ve sent a login link to <strong>{email}</strong>
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-base text-[#f77fbe] font-[Marble] hover:text-pink-300"
                >
                  Use a different email
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-400 text-red-200 px-4 py-3 rounded text-base">
                {error}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleOrgSignIn} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-base text-[#f77fbe] font-[Marble]"
                >
                  Organization Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full px-4 py-3 border border-[#f77fbe] bg-transparent rounded-md text-[#f77fbe] font-[Marble] placeholder-pink-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-white text-base"
                  placeholder="your@organization.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-white rounded-full text-base text-white font-[Marble] bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending link...
                    </span>
                  ) : (
                    "Send Magic Link"
                  )}
                </button>
              </div>
            </form>

            {/* Links under form */}
            <div className="text-center space-y-3">
              <div className="text-base text-blue-100 font-[Marble]">
                New to <span className="text-[#f77fbe]">BERRY</span>?{" "}
                <Link
                  href="/org"
                  className="text-white font-[Marble] underline underline-offset-4"
                >
                  Join now
                </Link>
              </div>
              <div className="text-base font-[Marble] text-blue-100">
                Are you a student?{" "}
                <Link
                  href="/auth"
                  className="text-white font-[Marble] underline underline-offset-4"
                >
                  Student sign in
                </Link>
              </div>
              <div className="text-base text-blue-100 font-[Marble]">
                <Link
                  href="/"
                  className="text-blue-100 font-[Marble] hover:text-white"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Info box at bottom */}
        <div className="mt-10 border border-white/30 bg-white/5 p-5 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-100"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-[Marble] text-white">
                Organization Access
              </h3>
              <div className="mt-2 text-base font-[Marble] text-blue-100">
                <p>
                  This portal is for registered organizations only. If your
                  organization isn&apos;t registered yet, please complete the
                  registration process first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
