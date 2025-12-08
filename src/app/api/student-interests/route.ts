import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const VALID_CATEGORIES = [
  'stem_innovation',
  'arts_design',
  'humanities_social_sciences',
  'civic_engagement_leadership',
  'business_entrepreneurship',
  'trades_technical',
  'health_wellness_environment'
] as const

const VALID_PREFERENCE_TYPES = [
  'programs',
  'summer_programs',
  'internships',
  'mentorships',
  'volunteering',
  'other'
] as const

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await request.json()

    console.log('Received student interests:', body)

    // Validate userId
    if (!body.userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      )
    }

    // Validate interests
    if (!Array.isArray(body.interests) || body.interests.length < 5) {
      return NextResponse.json(
        { message: "Please select at least 5 interest categories" },
        { status: 400 }
      )
    }

    // Validate priority interests
    const priorityInterests = body.interests.filter((i: Record<string, unknown>) => i.isPriority)
    if (priorityInterests.length < 3 || priorityInterests.length > 5) {
      return NextResponse.json(
        { message: "Please select between 3-5 priority interests" },
        { status: 400 }
      )
    }

    // Validate each interest category
    for (const interest of body.interests) {
      if (!VALID_CATEGORIES.includes(interest.category)) {
        return NextResponse.json(
          { message: `Invalid interest category: ${interest.category}` },
          { status: 400 }
        )
      }
    }

    // Validate opportunity preferences
    if (!Array.isArray(body.opportunityPreferences) || body.opportunityPreferences.length === 0) {
      return NextResponse.json(
        { message: "Please select at least one opportunity type" },
        { status: 400 }
      )
    }

    // Validate each preference type
    for (const pref of body.opportunityPreferences) {
      if (!VALID_PREFERENCE_TYPES.includes(pref.preferenceType)) {
        return NextResponse.json(
          { message: `Invalid opportunity preference: ${pref.preferenceType}` },
          { status: 400 }
        )
      }
    }

    // Check if student profile exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, onboarding_completed')
      .eq('id', body.userId)
      .maybeSingle()

    if (studentError || !student) {
      return NextResponse.json(
        { message: "Student profile not found. Please complete your profile first." },
        { status: 404 }
      )
    }

    // Delete existing interests (if updating)
    await supabase
      .from('student_interests')
      .delete()
      .eq('student_id', body.userId)

    // Delete existing opportunity preferences
    await supabase
      .from('student_opportunity_preferences')
      .delete()
      .eq('student_id', body.userId)

    // Insert new interests
    const interestsData = body.interests.map((interest: Record<string, unknown>) => ({
      student_id: body.userId,
      category: interest.category,
      is_priority: interest.isPriority || false
    }))

    const { error: interestsError } = await supabase
      .from('student_interests')
      .insert(interestsData)

    if (interestsError) {
      console.error('Error inserting interests:', interestsError)
      return NextResponse.json(
        {
          message: "Failed to save interests",
          error: interestsError.message
        },
        { status: 500 }
      )
    }

    // Insert opportunity preferences
    const preferencesData = body.opportunityPreferences.map((pref: Record<string, unknown>) => ({
      student_id: body.userId,
      preference_type: pref.preferenceType,
      other_description: pref.otherDescription || null
    }))

    const { error: preferencesError } = await supabase
      .from('student_opportunity_preferences')
      .insert(preferencesData)

    if (preferencesError) {
      console.error('Error inserting preferences:', preferencesError)
      return NextResponse.json(
        {
          message: "Failed to save opportunity preferences",
          error: preferencesError.message
        },
        { status: 500 }
      )
    }

    // Mark onboarding as completed
    const { error: updateError } = await supabase
      .from('students')
      .update({ onboarding_completed: true })
      .eq('id', body.userId)

    if (updateError) {
      console.error('Error updating onboarding status:', updateError)
      // Don't fail the request if this fails
    }

    console.log('Student interests saved successfully for user:', body.userId)

    return NextResponse.json(
      {
        message: "Interests saved successfully",
        onboardingCompleted: true
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing student interests:', error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve student interests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 }
    )
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch interests
    const { data: interests, error: interestsError } = await supabase
      .from('student_interests')
      .select('*')
      .eq('student_id', userId)

    if (interestsError) {
      console.error('Error fetching interests:', interestsError)
      return NextResponse.json(
        { message: "Error fetching interests" },
        { status: 500 }
      )
    }

    // Fetch opportunity preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('student_opportunity_preferences')
      .select('*')
      .eq('student_id', userId)

    if (preferencesError) {
      console.error('Error fetching preferences:', preferencesError)
      return NextResponse.json(
        { message: "Error fetching preferences" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        interests: interests || [],
        opportunityPreferences: preferences || []
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET student interests:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}