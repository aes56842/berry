import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { message: "Server configuration error: Missing Supabase environment variables" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await request.json()
    console.log('Received student profile data:', body)

    // Validate required fields
    const requiredFields = [
      'userId',
      'email',
      'firstName',
      'lastName',
      'dateOfBirth',
      'school',
      'gradeLevel',
      'ageVerified'
    ]

    const missingFields = requiredFields.filter(field => {
      if (field === 'ageVerified') {
        return body[field] !== true && body[field] !== false
      }
      return !body[field] || (typeof body[field] === 'string' && body[field].trim() === '')
    })

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      )
    }

    // Validate age verification
    if (!body.ageVerified) {
      return NextResponse.json(
        { message: "You must be at least 13 years old to use this platform" },
        { status: 400 }
      )
    }

    // Validate grade level
    const validGrades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    if (!validGrades.includes(body.gradeLevel)) {
      return NextResponse.json(
        { message: "Invalid grade level" },
        { status: 400 }
      )
    }

    // Validate GPA if provided
    if (body.gpa !== null && body.gpa !== undefined && body.gpa !== '') {
      const gpaNum = parseFloat(body.gpa)
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 5.0) {
        return NextResponse.json(
          { message: "GPA must be between 0 and 5.0" },
          { status: 400 }
        )
      }
    }

    // Validate date of birth format
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dobRegex.test(body.dateOfBirth)) {
      return NextResponse.json(
        { message: "Invalid date of birth format. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Check if student profile already exists
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('id', body.userId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing student:', checkError)
      return NextResponse.json(
        { message: "Error checking existing profile" },
        { status: 500 }
      )
    }

    if (existingStudent) {
      return NextResponse.json(
        { message: "Student profile already exists" },
        { status: 409 }
      )
    }

    // Create the student profile
    const studentData = {
      id: body.userId, // FK to auth.users
      email: body.email,
      first_name: body.firstName,
      last_name: body.lastName,
      date_of_birth: body.dateOfBirth,
      school: body.school,
      grade_level: body.gradeLevel,
      gpa: body.gpa || null,
      age_verified: body.ageVerified,
      onboarding_completed: false // Will be set to true after interests are selected
    }

    console.log('Inserting student profile:', studentData)
    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single()

    if (error) {
      console.error('Error inserting student profile:', error)
      return NextResponse.json(
        {
          message: "Failed to create student profile",
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    console.log('Student profile created successfully:', {
      id: data.id,
      email: data.email,
      grade_level: data.grade_level
    })

    return NextResponse.json(
      {
        message: "Profile created successfully",
        studentId: data.id,
        nextStep: "interests"
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing student profile:', error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve student profile
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

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching student:', error)
      return NextResponse.json(
        { message: "Error fetching student profile" },
        { status: 500 }
      )
    }

    if (!student) {
      return NextResponse.json(
        { message: "Student profile not found", exists: false },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        exists: true,
        profile: student,
        onboardingCompleted: student.onboarding_completed
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET student profile:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH endpoint to update student profile
export async function PATCH(request: NextRequest) {
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

    if (!body.userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}

    if (body.firstName) updateData.first_name = body.firstName
    if (body.lastName) updateData.last_name = body.lastName
    if (body.dateOfBirth) updateData.date_of_birth = body.dateOfBirth
    if (body.school) updateData.school = body.school
    if (body.gradeLevel) updateData.grade_level = body.gradeLevel
    if (body.gpa !== undefined) updateData.gpa = body.gpa || null
    if (body.onboardingCompleted !== undefined) updateData.onboarding_completed = body.onboardingCompleted

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', body.userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating student profile:', error)
      return NextResponse.json(
        { message: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        profile: data
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH student profile:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
