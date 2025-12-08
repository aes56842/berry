"use client"

// Force dynamic rendering to avoid prerendering issues with useSearchParams
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"
import Link from "next/link"

// Allowed email domains - get from environment if available
const ALLOWED_DOMAINS = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || "usc.edu,lausd.net").split(",")

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState<"student" | "org">("student")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin"

  // Validate if email domain is allowed for students
  const isAllowedDomain = (email: string): boolean => {
    if (!email || !email.includes('@')) return false
    
    const domain = email.split('@')[1].toLowerCase()
    
    // If role is "org", skip domain validation
    if (role === "org") return true
    
    // For students, check against allowed domains
    return ALLOWED_DOMAINS.includes(domain)
  }
  
  // Check for error parameters
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorMessage = searchParams.get('message')
    
    if (errorParam) {
      if (errorParam === 'access_denied' && searchParams.get('error_code') === 'otp_expired') {
        setError("This magic link has expired or is invalid. Please request a new one.")
      } else if (errorParam === 'domain_not_allowed') {
        setError(`Student accounts require an email address from ${ALLOWED_DOMAINS.join(" or ")}.`)
      } else if (errorMessage) {
        setError(decodeURIComponent(errorMessage))
      } else {
        setError(`Authentication error: ${errorParam}`)
      }
    }
  }, [searchParams])

  // Handle sign-in form submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email format
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address")
      return
    }

    // Domain validation for students - only if role is explicitly selected as student
    if (role === "student" && !isAllowedDomain(email)) {
      setError(`Student accounts require an email address from ${ALLOWED_DOMAINS.join(" or ")}.`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use signInWithOtp with shouldCreateUser: false to prevent new user creation during sign-in
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          shouldCreateUser: false // Don't create new users during sign-in
        }
      })

      if (signInError) {
        // If error is about user not found, show helpful message
        // comment
        if (signInError.message.includes('not found') || signInError.message.includes('User not found') || signInError.message.includes('Signups not allowed')) {
          setError("No account found with this email. Please sign up first.")
        } else {
          throw signInError
        }
        return
      }

      setEmailSent(true)

    } catch (err) {
      console.error("Sign in error:", err)
      const error = err as Error
      if (error.message.includes('not found') || error.message.includes('User not found') || error.message.includes('Signups not allowed')) {
        setError("No account found with this email. Please sign up first.")
      } else {
        setError(error.message || "Failed to send sign in link")
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle sign-up form submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email is provided
    if (!email) {
      setError("Please enter your email address")
      return
    }

    // Validate email format
    if (!email.includes('@')) {
      setError("Please enter a valid email address")
      return
    }

    // For organizations: require name upfront
    if (role === "org" && (!firstName || !lastName)) {
      setError("Please fill in all required fields")
      return
    }

    // Validate email domain for students
    if (role === "student" && !isAllowedDomain(email)) {
      setError(`Student registration is only available with ${ALLOWED_DOMAINS.join(" or ")} email addresses.`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build user metadata
      const userMetadata: Record<string, unknown> = {
        role: role,
        created_at: new Date().toISOString()
      }

      // Only include name for organizations (students provide this in onboarding)
      if (role === "org") {
        userMetadata.first_name = firstName
        userMetadata.last_name = lastName
        userMetadata.full_name = `${firstName} ${lastName}`
      }

      // For sign-up, include user metadata and ensure user creation is allowed
      const { error: signUpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          shouldCreateUser: true, // Explicitly allow user creation during sign-up
          data: userMetadata
        }
      })

      if (signUpError) throw signUpError
      setEmailSent(true)

    } catch (err) {
      console.error("Sign up error:", err)
      setError((err as Error).message || "Failed to send verification email")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle resend verification
  const handleResendVerification = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email address")
      return
    }
    
    // Domain validation for students when resending verification
    if (role === "student" && !isAllowedDomain(email)) {
      setError(`Student accounts require an email address from ${ALLOWED_DOMAINS.join(" or ")}.`)
      return
    }
    
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      })
      
      if (error) throw error
      setEmailSent(true)

    } catch (err) {
      setError((err as Error).message || "Failed to resend verification email")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Email validation helper for UI feedback
  const getEmailValidationState = () => {
    if (!email || !email.includes('@')) return null
    
    if (role === "student" && !isAllowedDomain(email)) {
      return {
        valid: false,
        message: `Student registration requires a ${ALLOWED_DOMAINS.join(" or ")} email address.`
      }
    }
    
    return { valid: true, message: null }
  }
  
  const emailValidation = getEmailValidationState()
  
  // Render based on mode (signup or signin)
  return (
    <div className="min-h-screen bg-[#004aad] from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Email sent confirmation screen */}
      {emailSent ? (
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">Check Your Email</h2>
          </div>
          <p className="mb-4 text-gray-600 text-center">
            We&apos;ve sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-gray-600 mb-8 text-center">
            Click the link to {mode === "signup" ? "complete your registration" : "sign in"}. 
            The link will expire in 1 hour.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setEmailSent(false)}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Use a different email
            </button>
            <Link href="/" className="block text-center w-full py-2 text-sm text-gray-600 hover:text-gray-900">
              Return to home page
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-md w-full bg-[#004aad] p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2">
              {mode === "signup" ? "Create an Account" : "Welcome Back"}
            </h2>
            <p className="mt-2 text-sm text-white">
              {mode === "signup" ? "Sign up to access Berry" : "Sign in to your account"}
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={mode === "signup" ? handleSignUp : handleSignIn} className="space-y-4">
            {/* Role selector (before email for signup) */}
            {mode === "signup" && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-white">
                  I am a
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as "student" | "org")
                    // Clear any existing error messages when changing role
                    setError(null)
                  }}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                >
                  <option value="student">Student</option>
                  <option value="org">Organization</option>
                </select>
              </div>
            )}
            
            {/* Sign-in mode also needs a role selector, but more subtle */}
            {mode === "signin" && (
              <div>
                <label htmlFor="signin-role" className="block text-sm font-medium text-white">
                  I am signing in as a
                </label>
                <select
                  id="signin-role"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as "student" | "org")
                    setError(null)
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                >
                  <option value="student">Student</option>
                  <option value="org">Organization</option>
                </select>
              </div>
            )}
            
            {/* Email field */}
            <div>
              <label htmlFor="email" className="flex justify-between items-center text-sm font-medium text-white">
                <span>Email {role === "student" && (
                  <span className="text-xs text-white">
                    (Must be {ALLOWED_DOMAINS.join(" or ")})
                  </span>
                )}</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null) // Clear errors when typing
                }}
                required
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                  emailValidation && !emailValidation.valid 
                    ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                disabled={isLoading}
                placeholder={role === "student" ? `your@${ALLOWED_DOMAINS[0]}` : "your@email.com"}
              />
              {emailValidation && !emailValidation.valid && (
                <p className="mt-1 text-sm text-red-600">{emailValidation.message}</p>
              )}
            </div>
            
            {/* Additional fields for sign-up - only for organizations */}
            {mode === "signup" && role === "org" && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                    placeholder="Last Name"
                  />
                </div>
              </>
            )}
            
            <button
              type="submit"
              disabled={isLoading || (role === "student" && !isAllowedDomain(email))}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                mode === "signup" ? "Create Account" : "Send Magic Link"
              )}
            </button>
          </form>
          
          <div className="mt-6 space-y-4">
            {mode === "signin" && (
              <div className="text-center">
                <button
                  onClick={handleResendVerification}
                  className="text-sm text-white hover:text-blue-500"
                >
                  Resend verification email
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-center">
              <div className="border-t border-gray-300 flex-grow mr-3"></div>
              <span className="text-sm text-gray-500">OR</span>
              <div className="border-t border-gray-300 flex-grow ml-3"></div>
            </div>

            <div className="text-center">
              <Link
                href={`/auth?mode=${mode === "signup" ? "signin" : "signup"}`}
                className="text-sm text-white hover:text-blue-500 font-medium"
              >
                {mode === "signup" ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </Link>
            </div>

            <div className="text-center">
              <Link href="/" className="text-sm text-white hover:text-blue-500">
                ← Back to home
              </Link>
            </div>
          </div>

          {mode === "signin" && (
            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Passwordless Login
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      We&apos;ll email you a magic link that will sign you in instantly.
                      No password needed!
                    </p>
                    
                    {role === "student" && (
                      <p className="mt-2">
                        <strong>Note:</strong> Student accounts require an email address from {ALLOWED_DOMAINS.join(" or ")}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === "signup" && role === "student" && (
            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Student Registration
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Student accounts require an email address from one of our approved educational domains: {ALLOWED_DOMAINS.join(", ")}
                    </p>
                    <p className="mt-2">
                      After verifying your email, you&apos;ll complete your profile with your name, school, and interests.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {mode === "signup" && role === "org" && (
            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Organization Registration
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Organizations can register with any valid email address. Your account will need to be approved before full access is granted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}