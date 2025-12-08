"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"

export default function StudentProfileOnboarding() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    school: "",
    gradeLevel: "",
    gpa: "",
    ageVerified: false
  })

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

    // Pre-fill email and name from auth metadata if available
    if (session.user.user_metadata) {
      setFormData(prev => ({
        ...prev,
        firstName: session.user.user_metadata.first_name || "",
        lastName: session.user.user_metadata.last_name || ""
      }))
    }

    // Check if profile already exists
    try {
      const response = await fetch(`/api/student-profile?userId=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          // Profile exists, redirect to interests or dashboard
          if (data.onboardingCompleted) {
            router.push('/dashboard/student')
          } else {
            router.push('/onboarding/interests')
          }
          return
        }
      }
    } catch (err) {
      console.error('Error checking profile:', err)
    }

    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate all required fields
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth ||
        !formData.school || !formData.gradeLevel) {
      setError("Please fill in all required fields")
      return
    }

    // Validate age
    const age = calculateAge(formData.dateOfBirth)
    if (age < 13) {
      setError("You must be at least 13 years old to use BERRY")
      return
    }

    // Validate age verification checkbox
    if (!formData.ageVerified) {
      setError("You must confirm that you are at least 13 years old")
      return
    }

    // Validate GPA if provided
    if (formData.gpa) {
      const gpaNum = parseFloat(formData.gpa)
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 5.0) {
        setError("GPA must be between 0.0 and 5.0")
        return
      }
    }

    if (!user) {
      setError("Authentication error. Please sign in again.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/student-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          school: formData.school,
          gradeLevel: formData.gradeLevel,
          gpa: formData.gpa || null,
          ageVerified: formData.ageVerified
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Success! Move to interests page
        router.push('/onboarding/interests')
      } else {
        setError(data.message || "Failed to create profile")
      }
    } catch (err) {
      console.error('Error creating profile:', err)
      setError("An error occurred while creating your profile")
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-xl">
                2
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 text-center">
              Let&apos;s get to know you better! This information helps us match you with the best opportunities.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age Verification */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="ageVerified"
                  name="ageVerified"
                  checked={formData.ageVerified}
                  onChange={handleInputChange}
                  required
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="ageVerified" className="ml-3 text-sm text-yellow-900">
                  <strong>I confirm that I am at least 13 years old</strong>
                  <p className="text-xs text-yellow-800 mt-1">
                    Students under 13 cannot use this platform independently. Parents may create a separate account in the future.
                  </p>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="First Name"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Last Name"
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level *
                </label>
                <select
                  id="gradeLevel"
                  name="gradeLevel"
                  required
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Grade</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                  School Attending *
                </label>
                <input
                  type="text"
                  id="school"
                  name="school"
                  required
                  value={formData.school}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Lincoln High School"
                />
              </div>

              <div>
                <label htmlFor="gpa" className="block text-sm font-medium text-gray-700 mb-2">
                  GPA (Optional)
                </label>
                <input
                  type="number"
                  id="gpa"
                  name="gpa"
                  step="0.01"
                  min="0"
                  max="5.0"
                  value={formData.gpa}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 3.75"
                />
                <p className="text-xs text-gray-500 mt-1">On a 0.0 - 5.0 scale</p>
              </div>
            </div>

            {/* Student Email Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Student Email:</strong> {user?.email}
              </p>
              <p className="text-xs text-blue-800 mt-1">
                This is your verified LAUSD/USC email address
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.ageVerified}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Next: Select Your Interests →"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
