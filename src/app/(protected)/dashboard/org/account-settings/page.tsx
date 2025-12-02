"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"

interface Organization {
  id: number
  org_name: string
  org_type: string
  org_email: string
  contact_name: string
  contact_role: string
  contact_email: string
}

export default function OrgAccountSettings() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const inputClass =
    "w-full rounded-[18px] border border-white/70 bg-transparent px-4 py-2.5 text-sm text-white font-[Marble] placeholder:text-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-transparent"

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth?mode=signin")
        return
      }

      const role = session.user.user_metadata?.role
      setUserRole(role || null)
      if (role !== "org") {
        router.push(role === "student" ? "/dashboard/student" : "/dashboard")
        return
      }

      const { data, error: orgError } = await supabase
        .from("organizations")
        .select(
          "id, org_name, org_type, org_email, contact_name, contact_role, contact_email"
        )
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (orgError) {
        setError(orgError.message)
      } else if (data) {
        setOrg(data as Organization)
      }

      setLoading(false)
    }

    load()
  }, [router])

  const handleChange = (field: keyof Organization, value: string) => {
    setOrg((prev) => (prev ? { ...prev, [field]: value } : prev))
    setSuccess(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!org) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?mode=signin")
        return
      }

      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          org_name: org.org_name?.trim(),
          org_type: org.org_type?.trim(),
          org_email: org.org_email?.trim(),
          contact_name: org.contact_name?.trim(),
          contact_role: org.contact_role?.trim(),
          contact_email: org.contact_email?.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", org.id)
        .eq("user_id", session.user.id)

      if (updateError) throw updateError

      setSuccess("Account settings saved.")
    } catch (err) {
      console.error("Error updating org settings:", err)
      setError(
        err instanceof Error ? err.message : "Failed to save account settings"
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#004aad] text-white font-[Marble] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white" />
      </div>
    )
  }

  if (!org || userRole !== "org") return null

  return (
    <div className="min-h-screen bg-[#004aad] text-white font-[Marble] overflow-x-hidden">
      <nav>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/dashboard/org"
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

      <main className="max-w-5xl mx-auto py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <header className="mb-8 text-center flex flex-col items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-[Marble] font-normal text-white">
            Account Settings
          </h1>
          <p className="mt-2 text-sm text-blue-100">
            Update your organization profile and contact information.
          </p>
        </header>

        <form
          onSubmit={handleSave}
          className="bg-white/10 backdrop-blur-sm border-2 border-white/40 shadow-2xl rounded-2xl px-6 py-6 sm:px-8 sm:py-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2">Organization Name</label>
              <input
                type="text"
                value={org.org_name || ""}
                onChange={(e) => handleChange("org_name", e.target.value)}
                className={inputClass}
                placeholder="Organization name"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Organization Type</label>
              <input
                type="text"
                value={org.org_type || ""}
                onChange={(e) => handleChange("org_type", e.target.value)}
                className={inputClass}
                placeholder="Nonprofit, Company, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2">Organization Email</label>
              <input
                type="email"
                value={org.org_email || ""}
                onChange={(e) => handleChange("org_email", e.target.value)}
                className={inputClass}
                placeholder="org@example.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Primary Contact Name</label>
              <input
                type="text"
                value={org.contact_name || ""}
                onChange={(e) => handleChange("contact_name", e.target.value)}
                className={inputClass}
                placeholder="Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2">Primary Contact Role</label>
              <input
                type="text"
                value={org.contact_role || ""}
                onChange={(e) => handleChange("contact_role", e.target.value)}
                className={inputClass}
                placeholder="Role"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Primary Contact Email</label>
              <input
                type="email"
                value={org.contact_email || ""}
                onChange={(e) => handleChange("contact_email", e.target.value)}
                className={inputClass}
                placeholder="contact@example.com"
              />
            </div>
          </div>

          {error && (
            <div className="border border-red-300/70 bg-red-500/10 text-red-100 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="border border-emerald-300/70 bg-emerald-500/10 text-emerald-100 rounded-xl px-4 py-3 text-sm">
              {success}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/org")}
              className="w-full sm:w-auto rounded-full border border-white/60 px-6 py-2.5 text-sm font-[Marble] text-white hover:bg-white hover:text-[#004aad] transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="h-4 w-4"
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
              Back to Dashboard
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto rounded-full bg-[#f77fbe] px-12 py-3 text-sm font-[Marble] text-white shadow-md hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:bg-[#f992c8] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
