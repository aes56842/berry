import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET() {
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

    // Get all organizations
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json(
        { 
          message: "Failed to fetch organizations",
          error: error.message
        },
        { status: 500 }
      )
    }

    // Separate pending and approved organizations
    const pendingOrgs = organizations.filter(org => !org.approved)
    const approvedOrgs = organizations.filter(org => org.approved)

    return NextResponse.json({
      pending: pendingOrgs,
      approved: approvedOrgs,
      total: organizations.length
    })

  } catch (error) {
    console.error('Error in GET organizations:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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
    
    const { organizationId, approved } = body

    if (!organizationId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { message: "Organization ID and approved status are required" },
        { status: 400 }
      )
    }

    // If approving, first check that email is verified
    if (approved) {
      const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('verification_status')
        .eq('id', organizationId)
        .single()

      if (fetchError) {
        console.error('Error fetching organization:', fetchError)
        return NextResponse.json(
          {
            message: "Failed to fetch organization details",
            error: fetchError.message
          },
          { status: 500 }
        )
      }

      // Validate that email is verified before allowing approval
      if (org.verification_status !== 'email_verified' && org.verification_status !== 'approved') {
        return NextResponse.json(
          {
            message: "Cannot approve organization: Email not yet verified. Please ensure the organization has verified their email before approving.",
            currentStatus: org.verification_status
          },
          { status: 400 }
        )
      }
    }

    // Update organization approval status and verification_status
    const updateData: Record<string, unknown> = { approved }
    if (approved) {
      updateData.verification_status = 'approved'
    } else {
      updateData.verification_status = 'rejected'
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      return NextResponse.json(
        { 
          message: "Failed to update organization",
          error: error.message
        },
        { status: 500 }
      )
    }

    console.log(`Organization ${organizationId} ${approved ? 'approved' : 'unapproved'} by admin`)

    return NextResponse.json({
      message: `Organization ${approved ? 'approved' : 'unapproved'} successfully`,
      organization: data
    })

  } catch (error) {
    console.error('Error in PATCH organizations:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { message: "Server configuration error: Missing Supabase environment variables" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      )
    }

    // Delete the organization (cascade will handle related records)
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId)

    if (error) {
      console.error('Error deleting organization:', error)
      return NextResponse.json(
        { message: "Failed to delete organization", error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE organizations:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
