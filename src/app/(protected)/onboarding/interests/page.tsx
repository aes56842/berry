"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"

const INTEREST_CATEGORIES = [
  { id: 'stem_innovation', label: 'STEM & Innovation', icon: '🔬', description: 'Science, Technology, Engineering, Math' },
  { id: 'arts_design', label: 'Arts & Design', icon: '🎨', description: 'Visual arts, graphic design, creative media' },
  { id: 'humanities_social_sciences', label: 'Humanities & Social Sciences', icon: '📚', description: 'History, literature, psychology, sociology' },
  { id: 'civic_engagement_leadership', label: 'Civic Engagement & Leadership', icon: '🗳️', description: 'Community service, activism, student government' },
  { id: 'business_entrepreneurship', label: 'Business & Entrepreneurship', icon: '💼', description: 'Startups, finance, marketing, management' },
  { id: 'trades_technical', label: 'Trades & Technical Careers', icon: '🔧', description: 'Construction, automotive, electronics, skilled trades' },
  { id: 'health_wellness_environment', label: 'Health, Wellness & Environment', icon: '🌱', description: 'Medicine, fitness, sustainability, ecology' }
]

const OPPORTUNITY_TYPES = [
  { id: 'programs', label: 'Programs', description: 'Educational programs and workshops' },
  { id: 'summer_programs', label: 'Summer Programs/Courses', description: 'Summer learning opportunities' },
  { id: 'internships', label: 'Internships', description: 'Work experience and career exploration' },
  { id: 'mentorships', label: 'Mentorships', description: 'One-on-one guidance and support' },
  { id: 'volunteering', label: 'Volunteering', description: 'Community service opportunities' },
  { id: 'other', label: 'Other', description: 'Scholarships, competitions, etc.' }
]

export default function StudentInterestsOnboarding() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [selectedOpportunities, setSelectedOpportunities] = useState<Set<string>>(new Set())
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set())
  const [priorityInterests, setPriorityInterests] = useState<Set<string>>(new Set())
  const [otherDescription, setOtherDescription] = useState("")

  useEffect(() => {
    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/auth?mode=signin')
      return
    }

    setUser(session.user)

    // Check if profile exists
    try {
      const response = await fetch(`/api/student-profile?userId=${session.user.id}`)
      if (!response.ok || !(await response.json()).exists) {
        // No profile, redirect to profile page
        router.push('/onboarding/profile')
        return
      }
    } catch (err) {
      console.error('Error checking profile:', err)
      router.push('/onboarding/profile')
      return
    }

    setIsLoading(false)
  }

  const handleOpportunityToggle = (opportunityId: string) => {
    const newSelected = new Set(selectedOpportunities)
    if (newSelected.has(opportunityId)) {
      newSelected.delete(opportunityId)
    } else {
      newSelected.add(opportunityId)
    }
    setSelectedOpportunities(newSelected)
  }

  const handleInterestToggle = (interestId: string) => {
    const newSelected = new Set(selectedInterests)
    const newPriority = new Set(priorityInterests)

    if (newSelected.has(interestId)) {
      newSelected.delete(interestId)
      newPriority.delete(interestId) // Also remove from priority if deselected
    } else {
      newSelected.add(interestId)
    }

    setSelectedInterests(newSelected)
    setPriorityInterests(newPriority)
  }

  const handlePriorityToggle = (interestId: string) => {
    if (!selectedInterests.has(interestId)) {
      return // Can't make it priority if not selected
    }

    const newPriority = new Set(priorityInterests)

    if (newPriority.has(interestId)) {
      newPriority.delete(interestId)
    } else {
      // Limit to 5 priority interests
      if (newPriority.size >= 5) {
        setError("You can only select up to 5 priority interests")
        return
      }
      newPriority.add(interestId)
    }

    setPriorityInterests(newPriority)
    setError("") // Clear error when valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate opportunity types
    if (selectedOpportunities.size === 0) {
      setError("Please select at least one opportunity type you're looking for")
      return
    }

    // Validate interests
    if (selectedInterests.size < 5) {
      setError("Please select at least 5 interest categories")
      return
    }

    // Validate priority interests
    if (priorityInterests.size < 3 || priorityInterests.size > 5) {
      setError("Please select between 3-5 priority interests (marked with a star)")
      return
    }

    // Validate "Other" description if selected
    if (selectedOpportunities.has('other') && !otherDescription.trim()) {
      setError("Please describe what other opportunities you're looking for")
      return
    }

    if (!user) {
      setError("Authentication error. Please sign in again.")
      return
    }

    setIsSubmitting(true)

    try {
      // Build interests array
      const interests = Array.from(selectedInterests).map(category => ({
        category,
        isPriority: priorityInterests.has(category)
      }))

      // Build opportunity preferences array
      const opportunityPreferences = Array.from(selectedOpportunities).map(preferenceType => ({
        preferenceType,
        otherDescription: preferenceType === 'other' ? otherDescription : null
      }))

      const response = await fetch('/api/student-interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          interests,
          opportunityPreferences
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Success! Redirect to student dashboard
        router.push('/dashboard/student')
      } else {
        setError(data.message || "Failed to save interests")
      }
    } catch (err) {
      console.error('Error saving interests:', err)
      setError("An error occurred while saving your interests")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                ✓
              </div>
              <div className="flex-1 h-1 bg-indigo-600 mx-2"></div>
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
              Tell Us Your Interests
            </h1>
            <p className="text-gray-600 text-center">
              Help us personalize your feed with opportunities that match your interests and goals
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Opportunity Types */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                What are you looking for? *
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Select all that apply
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OPPORTUNITY_TYPES.map(type => (
                  <div
                    key={type.id}
                    onClick={() => handleOpportunityToggle(type.id)}
                    className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                      selectedOpportunities.has(type.id)
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedOpportunities.has(type.id)}
                        onChange={() => {}} // Handled by div onClick
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedOpportunities.has('other') && (
                <div className="mt-4">
                  <label htmlFor="otherDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Please describe what you&apos;re looking for:
                  </label>
                  <input
                    type="text"
                    id="otherDescription"
                    value={otherDescription}
                    onChange={(e) => setOtherDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Scholarships, competitions, study abroad..."
                  />
                </div>
              )}
            </div>

            {/* Interest Categories */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select Your Interest Categories *
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Choose at least 5 categories that interest you, then mark 3-5 as priorities ⭐
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>How it works:</strong> Click to select categories. Click the star ⭐ on selected categories to mark them as priorities. Priority interests will appear more frequently in your personalized feed.
                </p>
              </div>

              <div className="space-y-3">
                {INTEREST_CATEGORIES.map(category => {
                  const isSelected = selectedInterests.has(category.id)
                  const isPriority = priorityInterests.has(category.id)

                  return (
                    <div
                      key={category.id}
                      className={`border-2 rounded-lg transition-all ${
                        isSelected
                          ? isPriority
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div
                          onClick={() => handleInterestToggle(category.id)}
                          className="flex items-center flex-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by div onClick
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">{category.icon}</span>
                              <div>
                                <p className="font-medium text-gray-900">{category.label}</p>
                                <p className="text-xs text-gray-600">{category.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => handlePriorityToggle(category.id)}
                            className={`ml-4 p-2 rounded-full transition-colors ${
                              isPriority
                                ? 'bg-yellow-400 text-white'
                                : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                            }`}
                            title={isPriority ? "Remove from priorities" : "Mark as priority"}
                          >
                            <span className="text-xl">⭐</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <strong>Selected:</strong> {selectedInterests.size} / 7 (minimum 5 required)
                </p>
                <p>
                  <strong>Priority:</strong> {priorityInterests.size} / 5 (3-5 required)
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/onboarding/profile')}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completing Setup...
                  </>
                ) : (
                  "Complete Setup & Go to Dashboard →"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
