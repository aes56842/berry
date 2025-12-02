"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "District of Columbia" },
]

const GRADE_LEVELS = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]

const CATEGORIES = [
  { value: "stem_innovation", label: "STEM & Innovation" },
  { value: "arts_design", label: "Art & Design" },
  { value: "humanities_social_sciences", label: "Humanities & Social Sciences" },
  { value: "civic_engagement_leadership", label: "Civic Engagement & Leadership" },
  { value: "health_sports_sustainability", label: "Health, Sports & Sustainability" },
  { value: "business_entrepreneurship", label: "Business & Entrepreneurship" },
  { value: "trades_technical", label: "Trade & Technical Careers" },
]

const OPPORTUNITY_TYPES = [
  { value: "program", label: "Program" },
  { value: "summer_opportunity", label: "Summer Opportunity" },
  { value: "internship", label: "Internship" },
  { value: "mentorship", label: "Mentorship" },
  { value: "volunteering", label: "Volunteering" },
]

const LOCATION_TYPES = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In-Person" },
  { value: "hybrid", label: "Hybrid" },
]

export default function EditOpportunityPage() {
  const router = useRouter()
  const params = useParams()
  const opportunityId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    opportunityName: "",
    category: "",
    opportunityType: "",
    startDate: "",
    endDate: "",
    locationType: "",
    locationAddress: "",
    locationState: "",
    minGpa: "",
    minAge: "",
    maxAge: "",
    gradeLevels: [] as string[],
    requirementsOther: "",
    cost: "0",
    hasStipend: false,
    applicationDeadline: "",
    briefDescription: "",
    applicationUrl: "",
    contactInfo: "",
  })

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunity()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId])

  const fetchOpportunity = async () => {
    try {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?mode=signin")
        return
      }

      const { data, error: fetchError } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", opportunityId)
        .eq("created_by", session.user.id)
        .single()

      if (fetchError || !data) {
        throw new Error("Opportunity not found or you do not have permission to edit it")
      }

      setFormData({
        opportunityName: data.opportunity_name || "",
        category: data.category || "",
        opportunityType: data.opportunity_type || "",
        startDate: data.start_date || "",
        endDate: data.end_date || "",
        locationType: data.location_type || "",
        locationAddress: data.location_address || "",
        locationState: data.location_state || "",
        minGpa: data.min_gpa?.toString() || "",
        minAge: data.min_age?.toString() || "",
        maxAge: data.max_age?.toString() || "",
        gradeLevels: data.grade_levels || [],
        requirementsOther: data.requirements_other || "",
        cost: data.cost?.toString() || "0",
        hasStipend: data.has_stipend || false,
        applicationDeadline: data.application_deadline || "",
        briefDescription: data.brief_description || "",
        applicationUrl: data.application_url || "",
        contactInfo: data.contact_info || "",
      })

      setLoading(false)
    } catch (err) {
      console.error("Error fetching opportunity:", err)
      setError(err instanceof Error ? err.message : "Failed to load opportunity")
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleGradeLevelToggle = (grade: string) => {
    setFormData((prev) => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(grade)
        ? prev.gradeLevels.filter((g) => g !== grade)
        : [...prev.gradeLevels, grade],
    }))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  const inputClass =
    "w-full rounded-[18px] border border-white/70 bg-transparent px-4 py-2.5 text-sm text-white font-[Marble] placeholder:text-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-transparent"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be signed in to edit opportunities")
      }

      const { error: updateError } = await supabase
        .from("opportunities")
        .update({
          opportunity_name: formData.opportunityName.trim(),
          brief_description: formData.briefDescription.trim(),
          category: formData.category,
          opportunity_type: formData.opportunityType,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          location_type: formData.locationType,
          location_address: formData.locationAddress?.trim() || null,
          location_state: formData.locationState || null,
          min_gpa: formData.minGpa ? parseFloat(formData.minGpa) : null,
          min_age: formData.minAge ? parseInt(formData.minAge) : null,
          max_age: formData.maxAge ? parseInt(formData.maxAge) : null,
          grade_levels: formData.gradeLevels.length > 0 ? formData.gradeLevels : null,
          requirements_other: formData.requirementsOther?.trim() || null,
          cost: parseFloat(formData.cost || "0"),
          has_stipend: formData.hasStipend,
          application_deadline: formData.applicationDeadline,
          application_url: formData.applicationUrl.trim(),
          contact_info: formData.contactInfo.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunityId)
        .eq("created_by", session.user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      router.push("/dashboard/org/my-opportunities")
    } catch (err) {
      console.error("Error updating opportunity:", err)
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while updating the opportunity",
      )
    } finally {
      setIsSubmitting(false)
    }
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

  if (error && !formData.opportunityName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-[Marble] bg-[#004aad] text-white">
        <div className="bg-red-500/10 border border-red-300/70 rounded-2xl p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold mb-2">Error Loading Opportunity</h2>
          <p className="text-red-100 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard/org/my-opportunities")}
            className="w-full rounded-full bg-rose-500 text-white px-6 py-2 text-sm font-semibold hover:bg-rose-600 transition"
          >
            Back to My Opportunities
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#004aad] text-white font-[Marble] overflow-x-hidden">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 mb-1">
              Opportunities
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-white">
              Edit Opportunity
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Update the details for this opportunity. Changes will be visible to students right away.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/org/my-opportunities")}
            className="px-4 py-2 rounded-full border border-white/60 text-sm font-semibold text-white hover:bg-white hover:text-[#004aad] transition-colors"
          >
            Back to list
          </button>
        </header>

        {error && (
          <div className="mb-6 border border-red-300/70 bg-red-500/10 rounded-xl px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-sm border-2 border-white/40 shadow-xl rounded-2xl px-4 py-6 sm:px-8 sm:py-8 space-y-8"
        >
          {/* Opportunity name */}
          <div>
            <label
              htmlFor="opportunityName"
              className="block text-sm font-medium text-white mb-2"
            >
              Opportunity Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="opportunityName"
              name="opportunityName"
              required
              value={formData.opportunityName}
              onChange={handleInputChange}
              className={inputClass}
            />
          </div>

          {/* Category / type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-white mb-2"
              >
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className={`${inputClass} bg-transparent`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="opportunityType"
                className="block text-sm font-medium text-white mb-2"
              >
                Type of Enrichment Opportunity{" "}
                <span className="text-rose-500">*</span>
              </label>
              <select
                id="opportunityType"
                name="opportunityType"
                required
                value={formData.opportunityType}
                onChange={handleInputChange}
                className={`${inputClass} bg-transparent`}
              >
                <option value="">Select opportunity type</option>
                {OPPORTUNITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-white mb-2"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-white mb-2"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="locationType"
              className="block text-sm font-medium text-white mb-2"
            >
              Location Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="locationType"
              name="locationType"
              required
              value={formData.locationType}
              onChange={handleInputChange}
              className={`${inputClass} bg-transparent`}
            >
              <option value="">Select location type</option>
              {LOCATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {(formData.locationType === "in_person" ||
            formData.locationType === "hybrid") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="locationAddress"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Physical Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="locationAddress"
                  name="locationAddress"
                  required={
                    formData.locationType === "in_person" ||
                    formData.locationType === "hybrid"
                  }
                  value={formData.locationAddress}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="locationState"
                  className="block text-sm font-medium text-white mb-2"
                >
                  State
                </label>
                <select
                  id="locationState"
                  name="locationState"
                  value={formData.locationState}
                  onChange={handleInputChange}
                  className={`${inputClass} bg-transparent`}
                >
                  <option value="">Select a state (optional)</option>
                  {US_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Requirements */}
          <section className="border-t border-white/20 pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Requirements (optional)
              </h3>
              <p className="text-[11px] text-blue-100">
                These help students see if they&apos;re a good match.
              </p>
            </div>

            <div className="max-w-xs">
              <label
                htmlFor="minGpa"
                className="block text-sm font-medium text-white mb-2"
              >
                Minimum GPA
              </label>
              <input
                type="number"
                id="minGpa"
                name="minGpa"
                step="0.01"
                min="0"
                max="5"
                value={formData.minGpa}
                onChange={handleInputChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
              <div>
                <label
                  htmlFor="minAge"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Minimum Age
                </label>
                <input
                  type="number"
                  id="minAge"
                  name="minAge"
                  min="0"
                  max="100"
                  value={formData.minAge}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="maxAge"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Maximum Age
                </label>
                <input
                  type="number"
                  id="maxAge"
                  name="maxAge"
                  min="0"
                  max="100"
                  value={formData.maxAge}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Grade Levels
              </label>
              <div className="grid grid-cols-7 sm:grid-cols-13 gap-2 max-w-lg">
                {GRADE_LEVELS.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => handleGradeLevelToggle(grade)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      formData.gradeLevels.includes(grade)
                        ? "bg-[#f77fbe] text-[#004aad] border-[#f77fbe]"
                        : "bg-transparent text-white border-white/70 hover:bg-white/10"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="requirementsOther"
                className="block text-sm font-medium text-white mb-2"
              >
                Other Requirements
              </label>
              <textarea
                id="requirementsOther"
                name="requirementsOther"
                rows={3}
                value={formData.requirementsOther}
                onChange={handleInputChange}
                className={`${inputClass} min-h-[100px]`}
              />
            </div>
          </section>

          {/* Cost & deadline */}
          <section className="space-y-6 border-t border-white/20 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="cost"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Cost (USD) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  required
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={handleInputChange}
                  className={inputClass}
                />
                <div className="mt-2">
                  <label className="inline-flex items-center text-sm text-white">
                    <input
                      type="checkbox"
                      name="hasStipend"
                      checked={formData.hasStipend}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-white/70 bg-transparent text-[#f77fbe] focus:ring-[#f77fbe]"
                    />
                    <span className="ml-2">
                      This opportunity provides a stipend
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="applicationDeadline"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Application Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  id="applicationDeadline"
                  name="applicationDeadline"
                  required
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Description & links */}
          <section className="space-y-6 border-t border-white/20 pt-6">
            <div>
              <label
                htmlFor="briefDescription"
                className="block text-sm font-medium text-white mb-2"
              >
                Brief Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="briefDescription"
                name="briefDescription"
                required
                rows={5}
                value={formData.briefDescription}
                onChange={handleInputChange}
                className={`${inputClass} min-h-[140px]`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="applicationUrl"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Formal Application Link or Website URL{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  id="applicationUrl"
                  name="applicationUrl"
                  required
                  value={formData.applicationUrl}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="contactInfo"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Contact Information <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactInfo"
                  name="contactInfo"
                  required
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="e.g., contact@organization.org or (555) 123-4567"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/20">
            <button
              type="button"
              onClick={() => router.push("/dashboard/org/my-opportunities")}
              className="w-full sm:w-auto justify-center rounded-full border border-white/60 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white hover:text-[#004aad] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto justify-center rounded-full bg-[#f77fbe] px-10 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-[#f992c8] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update opportunity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
