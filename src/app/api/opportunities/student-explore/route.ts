import { NextResponse } from "next/server";
// use server helper that awaits cookies()
import { createClient as createServerSupabase } from "@/app/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Valid category values in database
const VALID_CATEGORIES = [
  'stem_innovation',
  'arts_design',
  'humanities_social_sciences',
  'civic_engagement_leadership',
  'health_sports_sustainability',
  'business_entrepreneurship',
  'trades_technical'
];

export async function GET(req: Request) {
  // create server supabase client using your helper (it awaits cookies())
  const serverSupabase = await createServerSupabase();

  // Authenticate the user server-side (verifies with Supabase)
  const { data: userData, error: userErr } = await serverSupabase.auth.getUser();
  if (userErr || !userData?.user) {
    console.error("Unauthorized or error getting user", userErr);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // create service-role client (server-only). Must exist in env.
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
    return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
  }
  const svc = createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "50")));
    const from = (page - 1) * pageSize;
    const to = page * pageSize - 1;

    // optional filters
    const searchRaw = url.searchParams.get("search") ?? "";
    const search = searchRaw.trim();
    let category = url.searchParams.get("category") ?? "";
    
    // Normalize category - make sure it's a valid database value
    if (category && !VALID_CATEGORIES.includes(category)) {
      // Try to fix common formatting issues
      category = category
        .toLowerCase()
        .replace(/\s+&\s+/g, "_")
        .replace(/\s+/g, "_")
        .trim();
    }
    
    // Only filter by category if it's valid
    const hasValidCategory = category && VALID_CATEGORIES.includes(category);

    // If searching, first find matching organization IDs
    let matchingOrgIds: string[] = [];
    if (search) {
      const pattern = `%${search.replace(/%/g, "\\%")}%`;
      const { data: matchingOrgs } = await svc
        .from("organizations")
        .select("id")
        .ilike("org_name", pattern);

      if (matchingOrgs && matchingOrgs.length > 0) {
        matchingOrgIds = matchingOrgs.map((org: Record<string, unknown>) => org.id as string);
      }
    }

    // build query
    let q = svc
      .from("opportunities")
      .select(
        "id, opportunity_name, brief_description, category, opportunity_type, application_deadline, organization_id"
      )
      .order("application_deadline", { ascending: true });

    if (hasValidCategory) {
      q = q.eq("category", category);
    }

    if (search) {
      // ilike pattern
      const pattern = `%${search.replace(/%/g, "\\%")}%`;
      // search in name OR brief_description OR organization name (via matching org IDs)
      if (matchingOrgIds.length > 0) {
        q = q.or(`opportunity_name.ilike.${pattern},brief_description.ilike.${pattern},organization_id.in.(${matchingOrgIds.join(",")})`);
      } else {
        q = q.or(`opportunity_name.ilike.${pattern},brief_description.ilike.${pattern}`);
      }
    }

    const { data: opportunitiesRaw, error: oppError } = await q.range(from, to);

    if (oppError) {
      console.error("Error fetching opportunities:", oppError);
      return NextResponse.json({ message: "Failed to load opportunities" }, { status: 500 });
    }

    const opportunitiesList = Array.isArray(opportunitiesRaw) ? opportunitiesRaw : [];

    // exclude opportunities whose application_deadline is in the past
    const now = new Date();
    const opportunitiesListFiltered = opportunitiesList.filter((o: Record<string, unknown>) => {
      if (!o?.application_deadline) return true; // keep if no deadline
      const d = new Date(o.application_deadline as string);
      return d >= now;
    });

    // use the filtered list going forward
    const effectiveOpportunities = opportunitiesListFiltered;

    // Collect unique organization ids referenced by the opportunities
    const orgIds = Array.from(
      new Set(effectiveOpportunities.map((o: Record<string, unknown>) => o.organization_id).filter(Boolean))
    );

    // Fetch organization names in one query
    let orgs: Record<string, unknown>[] = [];
    if (orgIds.length) {
      const { data: orgRows, error: orgErr } = await svc
        .from("organizations")
        .select("id, org_name")
        .in("id", orgIds);

      if (orgErr) {
        console.error("Error fetching organizations:", orgErr);
      } else {
        orgs = orgRows ?? [];
      }
    }

    const orgMap = new Map<string, string | null>(orgs.map((r: Record<string, unknown>) => [r.id as string, (r.org_name as string) ?? null]));

    // Attach org_name to each opportunity
    const opportunities = effectiveOpportunities.map((o: Record<string, unknown>) => ({
      ...o,
      org_name: o.organization_id ? orgMap.get(o.organization_id as string) ?? null : null,
    }));

    console.log(
      `student-explore: returned=${opportunities.length} page=${page} pageSize=${pageSize} search="${search}" category="${category}"`
    );

    return NextResponse.json({
      data: opportunities,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("Unexpected error in student-explore:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}