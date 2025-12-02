'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/app/lib/supabaseClient'

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' }
]

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

const CATEGORIES = [
  { value: 'stem_innovation', label: 'STEM & Innovation' },
  { value: 'arts_design', label: 'Art & Design' },
  { value: 'humanities_social_sciences', label: 'Humanities & Social Sciences' },
  { value: 'civic_engagement_leadership', label: 'Civic Engagement & Leadership' },
  { value: 'health_sports_sustainability', label: 'Health, Sports & Sustainability' },
  { value: 'business_entrepreneurship', label: 'Business & Entrepreneurship' },
  { value: 'trades_technical', label: 'Trade & Technical Careers' }
]

const OPPORTUNITY_TYPES = [
  { value: 'program', label: 'Program' },
  { value: 'summer_opportunity', label: 'Summer Opportunity' },
  { value: 'internship', label: 'Internship' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'volunteering', label: 'Volunteering' }
]

const LOCATION_TYPES = [
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'In-Person' },
  { value: 'hybrid', label: 'Hybrid' }
]

export default function PostOpportunityPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [formData, setFormData] = useState({
    opportunityName: '',
    category: '',
    opportunityType: '',
    startDate: '',
    endDate: '',
    locationType: '',
    locationAddress: '',
    locationState: '',
    minGpa: '',
    minAge: '',
    maxAge: '',
    gradeLevels: [] as string[],
    requirementsOther: '',
    cost: '0',
    hasStipend: false,
    applicationDeadline: '',
    briefDescription: '',
    applicationUrl: '',
    contactInfo: ''
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleGradeLevelToggle = (grade: string) => {
    setFormData(prev => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(grade)
        ? prev.gradeLevels.filter(g => g !== grade)
        : [...prev.gradeLevels, grade]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('You must be signed in to post opportunities')
      }

      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit opportunity')
      }

      setShowSuccessModal(true)
    } catch (err) {
      console.error('Error submitting opportunity:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while submitting the opportunity'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    router.push('/dashboard/org')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth?mode=signin')
  }

  // shared input style for the “blue screen” look
  const inputClass =
    'w-full rounded-[18px] border border-white/70 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-transparent'

  return (
    <div className="min-h-screen bg-[#004aad] text-white overflow-x-hidden">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 font-[Marble]">
        {/* Top heading block */}
        <div className="mb-6 text-center sm:text-left">
          <p className="text-base sm:text-lg text-[#f77fbe] tracking-wide font-[Marble]">
            Post Opportunity
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl leading-snug">
            Tell us about the opportunity
          </h1>
        </div>

        <section className="card bg-white/10 rounded-3xl border border-white/20 shadow-[0_30px_80px_rgba(82,178,191,0.25)] px-5 sm:px-8 py-8 space-y-8">
          {/* Error banner */}
          {error && (
            <div className="rounded-2xl border border-red-300/70 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex gap-3">
              <span className="mt-0.5">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7h2v5H9V7zm0 6h2v2H9v-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-10"
          >
          {/* BASIC INFO + REQUIREMENTS – like first blue mock */}
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                {/* Opportunity Name */}
                <div>
                  <label
                    htmlFor="opportunityName"
                    className="block text-sm mb-1.5"
                  >
                    Opportunity Name <span className="text-[#f77fbe]">*</span>
                  </label>
                  <input
                    type="text"
                    id="opportunityName"
                    name="opportunityName"
                    required
                    value={formData.opportunityName}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="e.g., Summer Research Internship"
                  />
                </div>

                {/* Type + Category */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="opportunityType"
                      className="block text-sm mb-1.5"
                    >
                      What type of enrichment opportunity is this?{' '}
                      <span className="text-[#f77fbe]">*</span>
                    </label>
                    <select
                      id="opportunityType"
                      name="opportunityType"
                      required
                      value={formData.opportunityType}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      <option value="">(Dropdown Menu)</option>
                      {OPPORTUNITY_TYPES.map(type => (
                        <option
                          key={type.value}
                          value={type.value}
                          className="text-black"
                        >
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm mb-1.5">
                      Category <span className="text-[#f77fbe]">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map(cat => (
                        <option
                          key={cat.value}
                          value={cat.value}
                          className="text-black"
                        >
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration dates */}
                <div>
                  <label className="block text-sm mb-1.5">
                    Duration Dates
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
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
                <div className="space-y-3">
                  <label className="block text-sm mb-1.5">
                    Location
                  </label>
                  <select
                    id="locationType"
                    name="locationType"
                    required
                    value={formData.locationType}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="">(Online / In-Person / Hybrid)</option>
                    {LOCATION_TYPES.map(type => (
                      <option
                        key={type.value}
                        value={type.value}
                        className="text-black"
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>

                  {(formData.locationType === 'in_person' ||
                    formData.locationType === 'hybrid') && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          id="locationAddress"
                          name="locationAddress"
                          required
                          value={formData.locationAddress}
                          onChange={handleInputChange}
                          className={inputClass}
                          placeholder="(Online / Address)"
                        />
                      </div>
                      <select
                        id="locationState"
                        name="locationState"
                        value={formData.locationState}
                        onChange={handleInputChange}
                        className={inputClass}
                      >
                        <option value="">State (optional)</option>
                        {US_STATES.map(state => (
                          <option
                            key={state.code}
                            value={state.code}
                            className="text-black"
                          >
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Brief description */}
                <div>
                  <label
                    htmlFor="briefDescription"
                    className="block text-sm mb-1.5"
                  >
                    Brief Description (This will be showcased to students){' '}
                    <span className="text-[#f77fbe]">*</span>
                  </label>
                  <textarea
                    id="briefDescription"
                    name="briefDescription"
                    required
                    rows={4}
                    value={formData.briefDescription}
                    onChange={handleInputChange}
                    className={`${inputClass} min-h-[120px]`}
                    placeholder="Describe what students will do, learn, and why this opportunity matters..."
                  />
                </div>
              </div>

              {/* RIGHT COLUMN – “All Requirements” section */}
              <div className="space-y-5">
                {/* GPA */}
                <div className="max-w-xs">
                  <label htmlFor="minGpa" className="block text-sm mb-1.5">
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
                    placeholder="e.g., 3.5"
                  />
                </div>

                {/* Age range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <div>
                    <label htmlFor="minAge" className="block text-sm mb-1.5">
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
                      placeholder="e.g., 16"
                    />
                  </div>
                  <div>
                    <label htmlFor="maxAge" className="block text-sm mb-1.5">
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
                      placeholder="e.g., 18"
                    />
                  </div>
                </div>

                {/* Grade levels */}
                <div>
                  <label className="block text-sm mb-1.5">Grade Levels</label>
                  <p className="text-[11px] text-white/70 mb-2">
                    Select all that apply.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_LEVELS.map(grade => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => handleGradeLevelToggle(grade)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                          formData.gradeLevels.includes(grade)
                            ? 'bg-[#f77fbe] text-[#004aad] border-[#f77fbe]'
                            : 'bg-transparent text-white border-white/70 hover:bg-white/10'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Other requirements */}
                <div>
                  <textarea
                    id="requirementsOther"
                    name="requirementsOther"
                    rows={5}
                    value={formData.requirementsOther}
                    onChange={handleInputChange}
                    className={`${inputClass} min-h-[120px]`}
                    placeholder="Other requirements (California resident, specific skills, recommendations, etc.)"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* COST + DEADLINE – aligns with “Cost / Deadline” row */}
          <section className="space-y-6 border-t border-white/20 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cost */}
              <div>
                <label htmlFor="cost" className="block text-sm mb-1.5">
                  Cost (USD) <span className="text-[#f77fbe]">*</span>
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
                  placeholder="0 for free opportunities"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-white">
                  <input
                    type="checkbox"
                    name="hasStipend"
                    checked={formData.hasStipend}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-white/70 bg-transparent text-[#f77fbe] focus:ring-[#f77fbe]"
                  />
                  This opportunity provides a stipend
                </label>
              </div>

              {/* Deadline */}
              <div>
                <label
                  htmlFor="applicationDeadline"
                  className="block text-sm mb-1.5"
                >
                  Application Deadline <span className="text-[#f77fbe]">*</span>
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

          {/* LINKS & CONTACT – like second mock screen */}
          <section className="space-y-6 border-t border-white/20 pt-8">
            <div>
              <label
                htmlFor="applicationUrl"
                className="block text-sm mb-1.5"
              >
                Please upload link to formal application link OR application home
                website (this is where students will be redirected to apply){' '}
                <span className="text-[#f77fbe]">*</span>
              </label>
              <input
                type="url"
                id="applicationUrl"
                name="applicationUrl"
                required
                value={formData.applicationUrl}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="https://example.org/apply"
              />
            </div>

            <div>
              <label htmlFor="contactInfo" className="block text-sm mb-1.5">
                Where may students direct any questions?{' '}
                <span className="text-[#f77fbe]">*</span>
              </label>
              <input
                type="text"
                id="contactInfo"
                name="contactInfo"
                required
                value={formData.contactInfo}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="(Contact information)"
              />
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/20">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto rounded-full border border-white/70 px-8 py-2.5 text-sm font-[Marble] text-white hover:bg-white/10 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.35)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-full bg-[#f77fbe] px-10 py-2.5 text-sm font-[Marble] text-white shadow-md hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:bg-[#f992c8] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Opportunity'}
            </button>
          </div>
        </form>
        </section>
      </div>

      {/* SUCCESS “THANK YOU” MODAL – we keep your logic but on brand */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-[#004aad] text-white px-8 py-10 shadow-2xl text-center font-[Marble] font-normal border border-white/30 shadow-[0_0_35px_rgba(247,127,190,0.35)]">
            <h2 className="text-3xl sm:text-4xl mb-4 text-[#f77fbe]">
              THANK YOU!
            </h2>
            <p className="text-lg mb-2">
              Submission received! We&apos;ll send you a confirmation email once
              your opportunity is available on BERRY.
            </p>
            <p className="text-sm text-white/80 mb-8">
              Look out for an email in approximately 1–2 business days.
            </p>
            <div className="flex justify-center mb-6">
              <Image
                src="/logos/berry-caterpillar.png"
                alt="Berry caterpillar"
                width={350}
                height={150}
                className="h-28 w-auto select-none"
                priority
              />
            </div>
            <button
              onClick={handleSuccessClose}
              className="rounded-full bg-[#f77fbe] text-white px-10 py-2.5 text-sm font-[Marble] font-normal hover:bg-[#f992c8] transition hover:shadow-[0_0_20px_rgba(247,127,190,0.4)]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
