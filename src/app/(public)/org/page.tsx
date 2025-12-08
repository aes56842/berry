"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

type OrganizationType = "university" | "business" | "nonprofit" | "other"

interface FormData {
  // Step 1: Basic Company Information
  organizationName: string
  organizationType: OrganizationType | ""
  website: string
  officialEmailDomain: string
  phoneNumber: string
  businessAddress: string
  linkedinUrl: string

  // Step 2: Verification & Contact
  contactName: string
  contactRole: string
  contactEmail: string
  businessId: string

  // Verification documents (type-specific)
  ein: string
  ipeds: string
  businessLicense: string
  nonprofit501c3: string

  // Step 3: Goals
  goalsDescription: string
}

export default function OrganizationRegistration() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    organizationName: "",
    organizationType: "",
    website: "",
    officialEmailDomain: "",
    phoneNumber: "",
    businessAddress: "",
    linkedinUrl: "",
    contactName: "",
    contactRole: "",
    contactEmail: "",
    businessId: "",
    ein: "",
    ipeds: "",
    businessLicense: "",
    nonprofit501c3: "",
    goalsDescription: ""
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Validate current step before proceeding
  const validateStep = (step: number): boolean => {
    setError("")

    if (step === 1) {
      if (
        !formData.organizationName ||
        !formData.organizationType ||
        !formData.website ||
        !formData.officialEmailDomain ||
        !formData.phoneNumber ||
        !formData.businessAddress
      ) {
        setError("Please fill in all required fields in Step 1")
        return false
      }

      // Validate email domain format
      const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i
      if (!domainRegex.test(formData.officialEmailDomain)) {
        setError("Please enter a valid email domain (e.g., company.com)")
        return false
      }

      // Validate URL format
      try {
        new URL(formData.website)
      } catch {
        setError("Please enter a valid website URL")
        return false
      }
    }

    if (step === 2) {
      if (!formData.contactName || !formData.contactRole || !formData.contactEmail || !formData.businessId) {
        setError("Please fill in all required fields in Step 2")
        return false
      }

      // Validate that contact email matches official domain
      const contactDomain = formData.contactEmail.split("@")[1]?.toLowerCase()
      const officialDomain = formData.officialEmailDomain.toLowerCase()

      if (contactDomain !== officialDomain) {
        setError(`Contact email must use your official domain: @${formData.officialEmailDomain}`)
        return false
      }

      // Validate type-specific fields
      if (
        formData.organizationType === "university" &&
        !formData.ipeds &&
        !formData.officialEmailDomain.endsWith(".edu")
      ) {
        setError("Universities must provide IPEDS/NCES ID or use a .edu email domain")
        return false
      }

      if (formData.organizationType === "business" && (!formData.ein || !formData.businessLicense)) {
        setError("Businesses must provide EIN and Business License Number")
        return false
      }

      if (formData.organizationType === "nonprofit" && (!formData.ein || !formData.nonprofit501c3)) {
        setError("Nonprofits must provide EIN and 501(c)(3) documentation")
        return false
      }
    }

    if (step === 3) {
      if (!formData.goalsDescription || formData.goalsDescription.length < 50) {
        setError("Please provide a detailed description of your goals (minimum 50 characters)")
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(3)) {
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/org-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.message || "Failed to submit registration")
      }
    } catch {
      setError("An error occurred while submitting the form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Submitted!</h2>
            <p className="text-lg text-gray-600 mb-4">
              We&apos;ve sent you an email confirmation to <strong>{formData.contactEmail}</strong>
            </p>
            <p className="text-gray-600 mb-2">Please verify your email before moving forward.</p>
            <p className="text-gray-600 mb-8">
              Expect verification and approval within <strong>2-3 business days</strong>.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Check your email and verify your address</li>
                <li>Our team will manually review your application</li>
                <li>You&apos;ll receive approval notification within 2-3 business days</li>
                <li>Once approved, you can sign in and start posting opportunities</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#f77fbe] hover:bg-pink-500"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Progress indicator
  const steps = [
    { number: 1, title: "Company Info", desc: "Basic information" },
    { number: 2, title: "Verification", desc: "Contact & documents" },
    { number: 3, title: "Goals", desc: "Your mission" }
  ]

  return (
    <div className="min-h-screen bg-[#004aad] py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#004aad] shadow-lg rounded-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="text-[#f77fbe] hover:text-pink-300 flex items-center mb-4 text-sm font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>

            {/* Berry logo */}
            <div className="flex justify-center mb-4">
              <Image
                src="/logos/BERRY LOGO (svg).png" // put your logo file here
                alt="Berry logo"
                width={160}
                height={60}
                className="drop-shadow-lg"
              />
            </div>

            <h1 className="text-3xl font-bold text-[#f77fbe] mb-2 text-center">
              Organization Registration
            </h1>
            <p className="text-center text-sm sm:text-base text-blue-100">
              Complete this application to connect with LAUSD students through{" "}
              <span className="font-semibold text-[#f77fbe]">BERRY</span>
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      ${
                        currentStep >= step.number
                          ? "bg-[#f77fbe] text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step.number}
                    </div>
                    <div className="text-center mt-2">
                      <div
                        className={`text-xs font-semibold ${
                          currentStep >= step.number ? "text-[#f77fbe]" : "text-white"
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-blue-100">{step.desc}</div>
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        currentStep > step.number ? "bg-[#f77fbe]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-[#fef2f7] border border-[#fbb6d3] text-[#b83280] px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Basic Company Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-[#004aad] p-6 rounded-lg border border-[#f77fbe]/40">
                  <h2 className="text-xl font-semibold text-[#f77fbe] mb-4">
                    Basic Company Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label
                        htmlFor="organizationName"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Organization Name (Official Legal Name) *
                      </label>
                      <input
                        type="text"
                        id="organizationName"
                        name="organizationName"
                        required
                        value={formData.organizationName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder="e.g., Los Angeles Science Foundation"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="organizationType"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Type of Organization *
                      </label>
                      <select
                        id="organizationType"
                        name="organizationType"
                        required
                        value={formData.organizationType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                      >
                        <option value="">Select Type</option>
                        <option value="university">University / College / School</option>
                        <option value="nonprofit">Non-Profit</option>
                        <option value="business">Local Business</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="website"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Website URL (need https://) *
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        required
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder="https://www.example.com"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="officialEmailDomain"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Official Email Domain *
                      </label>
                      <input
                        type="text"
                        id="officialEmailDomain"
                        name="officialEmailDomain"
                        required
                        value={formData.officialEmailDomain}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder="e.g., company.com"
                      />
                      <p className="text-xs text-[#fbb6d3] mt-1">
                        Enter domain only (e.g., usc.edu, not @usc.edu)
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder="(123) 456-7890"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="businessAddress"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Business Address *
                      </label>
                      <input
                        type="text"
                        id="businessAddress"
                        name="businessAddress"
                        required
                        value={formData.businessAddress}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder="123 Main St, Los Angeles, CA 90001"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="linkedinUrl"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        LinkedIn Page or Social Media (Optional)
                      </label>
                      <input
                        type="url"
                        id="linkedinUrl"
                        name="linkedinUrl"
                        value={formData.linkedinUrl}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-[#52b2bf] text-white rounded-md hover:bg-[#f77fbe] font-medium"
                  >
                    Next: Verification & Contact →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Verification & Contact */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-[#004aad] p-6 rounded-lg border border-[#f77fbe]/40">
                  <h2 className="text-xl font-semibold text-[#f77fbe] mb-4">
                    Verification & Contact Authenticity
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="contactName"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="contactName"
                        name="contactName"
                        required
                        value={formData.contactName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder="Jane Smith"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contactRole"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Role / Title *
                      </label>
                      <input
                        type="text"
                        id="contactRole"
                        name="contactRole"
                        required
                        value={formData.contactRole}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder="e.g., Outreach Coordinator, Recruiter"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="contactEmail"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Official Organizational Email *
                      </label>
                      <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        required
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder={`you@${formData.officialEmailDomain || "yourcompany.com"}`}
                      />
                      <p className="text-xs text-[#fbb6d3] mt-1">
                        Must match your official domain. No Gmail, Outlook, etc.
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="businessId"
                        className="block text-sm font-medium text-[#f77fbe] mb-2"
                      >
                        Business ID / Org ID *
                      </label>
                      <input
                        type="text"
                        id="businessId"
                        name="businessId"
                        required
                        value={formData.businessId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                        placeholder="Enter your official registration ID"
                      />
                    </div>
                  </div>
                </div>

                {/* Type-Specific Verification Documents */}
                {formData.organizationType && (
                  <div className="bg-[#52b2bf] border border-[#f77fbe] p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Supporting Documents -{" "}
                      {formData.organizationType === "university"
                        ? "University"
                        : formData.organizationType === "business"
                        ? "Business"
                        : formData.organizationType === "nonprofit"
                        ? "Non-Profit"
                        : "Other"}
                    </h3>

                    {formData.organizationType === "university" && (
                      <div className="space-y-4">
                        <p className="text-sm text-white">
                          Universities must provide IPEDS/NCES Institution ID OR use a .edu email
                          domain
                        </p>
                        <div>
                          <label
                            htmlFor="ipeds"
                            className="block text-sm font-medium text-white mb-2"
                          >
                            IPEDS or NCES Institution ID
                          </label>
                          <input
                            type="text"
                            id="ipeds"
                            name="ipeds"
                            value={formData.ipeds}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
                            placeholder="Enter IPEDS/NCES ID (required if not using .edu)"
                          />
                        </div>
                      </div>
                    )}

                    {formData.organizationType === "business" && (
                      <div className="space-y-4">
                        <p className="text-sm text-white mb-4">
                          Businesses must provide EIN and Business License Number
                        </p>
                        <div>
                          <label
                            htmlFor="ein"
                            className="block text-sm font-medium text-white mb-2"
                          >
                            Employer Identification Number (EIN) *
                          </label>
                          <input
                            type="text"
                            id="ein"
                            name="ein"
                            required
                            value={formData.ein}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
                            placeholder="12-3456789"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="businessLicense"
                            className="block text-sm font-medium text-white mb-2"
                          >
                            Business License Number *
                          </label>
                          <input
                            type="text"
                            id="businessLicense"
                            name="businessLicense"
                            required
                            value={formData.businessLicense}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
                            placeholder="City/State license number"
                          />
                        </div>
                      </div>
                    )}

                    {formData.organizationType === "nonprofit" && (
                      <div className="space-y-4">
                        <p className="text-sm text-white mb-4">
                          Non-profits must provide EIN and 501(c)(3) documentation
                        </p>
                        <div>
                          <label
                            htmlFor="ein"
                            className="block text-sm font-medium text-white mb-2"
                          >
                            Employer Identification Number (EIN) *
                          </label>
                          <input
                            type="text"
                            id="ein"
                            name="ein"
                            required
                            value={formData.ein}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
                            placeholder="12-3456789"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="nonprofit501c3"
                            className="block text-sm font-medium text-white mb-2"
                          >
                            501(c)(3) Letter Reference / Confirmation Number *
                          </label>
                          <input
                            type="text"
                            id="nonprofit501c3"
                            name="nonprofit501c3"
                            required
                            value={formData.nonprofit501c3}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
                            placeholder="IRS determination letter reference"
                          />
                          <p className="text-xs text-blue-50 mt-1">
                            Please provide reference number or confirmation that you have 501(c)(3)
                            status
                          </p>
                        </div>
                      </div>
                    )}

                    {formData.organizationType === "other" && (
                      <div>
                        <p className="text-sm text-white">
                          Please ensure your Business ID is valid and verifiable.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-6 py-3 border border-gray-300 bg-[#52b2bf] rounded-md text-white hover:bg-[#f77fbe] font-medium"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-[#52b2bf] text-white rounded-md hover:bg-[#f77fbe] font-medium"
                  >
                    Next: Goals & Mission →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Goals */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-[#004aad] p-6 rounded-lg border border-[#f77fbe]/40">
                  <h2 className="text-xl font-semibold text-[#f77fbe] mb-4">Organization Goals</h2>

                  <div>
                    <label
                      htmlFor="goalsDescription"
                      className="block font-medium text-[#f77fbe] mb-2"
                    >
                      What are your organization&apos;s goals with LAUSD students? *
                    </label>
                    <textarea
                      id="goalsDescription"
                      name="goalsDescription"
                      required
                      rows={6}
                      value={formData.goalsDescription}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[#f77fbe] rounded-md focus:outline-none focus:ring-2 focus:ring-[#f77fbe] focus:border-[#f77fbe] text-gray-900"
                      placeholder="Describe what opportunities you plan to offer, how you'll support students, and your mission for engaging with the LAUSD community..."
                    />
                    <p className="text-xs text-[#fbb6d3] mt-1">
                      Minimum 50 characters. Be specific about programs, internships, or opportunities
                      you&apos;ll provide.
                    </p>
                  </div>
                </div>

                {/* Final Confirmation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-[#f77fbe]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[#b83280]">
                        What happens after submission?
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ol className="list-decimal list-inside space-y-1">
                          <li>
                            You&apos;ll receive an email confirmation at{" "}
                            <strong>{formData.contactEmail || "your email"}</strong>
                          </li>
                          <li>Verify your email before moving forward</li>
                          <li>Expect verification within 2-3 business days</li>
                          <li>Once approved, you can sign in and start posting opportunities</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-6 py-3 border bg-[#52b2bf] border-gray-300 rounded-md text-white hover:bg-[#f77fbe] font-medium"
                  >
                    ← Previous
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-[#52b2bf] text-white rounded-md hover:bg-[#f77fbe] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
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
                        Submitting...
                      </>
                    ) : (
                      "Submit Registration"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
