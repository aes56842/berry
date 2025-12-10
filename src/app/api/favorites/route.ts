import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseKey)

// GET: Fetch all favorites for the current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { message: "userId parameter is required", success: false },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("student_favorites")
      .select("opportunity_id, created_at")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("DB Error fetching favorites:", error)
      return NextResponse.json(
        { message: error.message || "Failed to fetch favorites", success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    })
  } catch (err) {
    console.error("Error fetching favorites:", err)
    return NextResponse.json(
      { message: "Failed to fetch favorites", success: false },
      { status: 500 }
    )
  }
}

// POST: Add a favorite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, opportunityId } = body

    if (!studentId || !opportunityId) {
      return NextResponse.json(
        { message: "studentId and opportunityId are required", success: false },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("student_favorites")
      .insert({
        student_id: studentId,
        opportunity_id: opportunityId,
      })
      .select()

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === "23505") {
        console.warn("Favorite already exists:", studentId, opportunityId)
        return NextResponse.json(
          { message: "Already favorited", success: true, data: null },
          { status: 200 }
        )
      }
      console.error("DB Error adding favorite:", error)
      return NextResponse.json(
        { message: error.message || "Failed to add favorite", success: false },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Added to favorites", data },
      { status: 201 }
    )
  } catch (err) {
    console.error("Error adding favorite:", err)
    return NextResponse.json(
      { message: "Failed to add favorite", success: false },
      { status: 500 }
    )
  }
}

// DELETE: Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const opportunityId = searchParams.get("opportunityId")

    if (!studentId || !opportunityId) {
      return NextResponse.json(
        { message: "studentId and opportunityId parameters are required", success: false },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("student_favorites")
      .delete()
      .eq("student_id", studentId)
      .eq("opportunity_id", opportunityId)

    if (error) {
      console.error("DB Error deleting favorite:", error)
      return NextResponse.json(
        { message: error.message || "Failed to delete favorite", success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Removed from favorites",
    })
  } catch (err) {
    console.error("Error removing favorite:", err)
    return NextResponse.json(
      { message: "Failed to remove favorite", success: false },
      { status: 500 }
    )
  }
}
