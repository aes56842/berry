import { NextResponse } from "next/server";
// use server helper that awaits cookies()
import { createClient as createServerSupabase } from "@/app/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const serverSupabase = await createServerSupabase();

  // require authenticated user (reuse same auth pattern)
  const { data: userData, error: userErr } = await serverSupabase.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });

  const svc = createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const { data, error } = await svc.from("opportunities").select("category").not("category", "is", null);
    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ message: "Failed to load categories" }, { status: 500 });
    }
    const categories = Array.isArray(data)
      ? Array.from(new Set(data.map((r: { category?: string }) => (r.category ?? "").trim()).filter(Boolean)))
      : [];

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Unexpected error fetching categories:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}