"use client";
//import "./student-profile.css";
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function StudentProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [school, setSchool] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [gpa, setGpa] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/auth?mode=signin");
          return;
        }

        setUserId(session.user.id);
        setEmail(session.user.email ?? "");

        // fetch profile from your API (falls back to auth metadata)
        const res = await fetch(
          `/api/student-profile?userId=${encodeURIComponent(session.user.id)}`,
          { cache: "no-store" }
        );

        if (res.ok) {
          const json = await res.json();
          const profile = json.profile ?? {};

          setFirstName(profile.first_name ?? session.user.user_metadata?.first_name ?? "");
          setLastName(profile.last_name ?? session.user.user_metadata?.last_name ?? "");
          setDateOfBirth(profile.date_of_birth ?? "");
          setSchool(profile.school ?? "");
          setGradeLevel(profile.grade_level ?? "");
          setGpa(profile.gpa != null ? String(profile.gpa) : "");
        } else {
          // no profile or error -> prefill from auth metadata
          setFirstName(session.user.user_metadata?.first_name ?? "");
          setLastName(session.user.user_metadata?.last_name ?? "");
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase();

  const validGrades = ["K","1","2","3","4","5","6","7","8","9","10","11","12"];

  const handleSave = async () => {
    setError(null);
    setMsg(null);
    if (!userId) {
      setError("User not available");
      return;
    }
    // basic validation same as server
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      setError("Date of birth format should be YYYY-MM-DD");
      return;
    }
    if (!validGrades.includes(gradeLevel)) {
      setError("Select a valid grade level");
      return;
    }
    if (gpa !== "") {
      const g = parseFloat(gpa);
      if (isNaN(g) || g < 0 || g > 5.0) {
        setError("GPA must be a number between 0 and 5.0");
        return;
      }
    }

    setSaving(true);
    try {
      const body: any = {
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        school: school.trim(),
        gradeLevel,
        gpa: gpa === "" ? null : gpa,
      };

      const res = await fetch("/api/student-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message ?? "Failed to save profile");
      } else {
        setMsg("Profile saved");
        // update local fields from returned profile if provided
        if (json.profile) {
          const p = json.profile;
          setFirstName(p.first_name ?? firstName);
          setLastName(p.last_name ?? lastName);
          setDateOfBirth(p.date_of_birth ?? dateOfBirth);
          setSchool(p.school ?? school);
          setGradeLevel(p.grade_level ?? gradeLevel);
          setGpa(p.gpa != null ? String(p.gpa) : "");
        }
      }
    } catch (e) {
      console.error("Failed to save profile", e);
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#004aad]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#004aad] text-white font-[Marble] py-10">
      
      <nav>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/dashboard/student"
              className="flex items-center"
            >
              <Image
                src="/logos/BERRY%20LOGO%20%28svg%29.png"
                alt="BERRY logo"
                width={160}
                height={60}
                className="h-auto w-40 max-w-full select-none transition-[filter] duration-200 hover:drop-shadow-[0_0_16px_rgba(247,127,190,0.65)]"
                priority
              />
            </Link>

            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full border border-white/60 text-sm font-[Marble] hover:bg-white hover:text-[#004aad] transition-all hover:shadow-[0_0_18px_rgba(247,127,190,0.55)]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4">
        {error && <div className="mb-4 p-4 bg-red-500/20 text-red-100 border border-red-400/40 rounded-lg">{error}</div>}
        {msg && <div className="mb-4 p-4 bg-green-500/20 text-green-100 border border-green-400/40 rounded-lg">{msg}</div>}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-[Marble] text-white">Personal Information</h1>
            <p className="text-sm text-blue-100 mt-1">Review and update your information</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="px-4 py-2 rounded-full border border-white/60 text-sm font-[Marble] hover:bg-white hover:text-[#004aad] transition-all hover:shadow-[0_0_18px_rgba(247,127,190,0.55)]"
            >
              Back
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 border-2 border-white/40 shadow-[0_30px_80px_rgba(82,178,191,0.35)] backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_35px_90px_rgba(247,127,190,0.35)] overflow-hidden">
          <div className="px-6 py-6 border-b border-white/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[#52b2bf]/30 text-[#52b2bf] border-2 border-[#52b2bf]/50 font-[Marble] text-xl">
                {initials.trim() || (email.charAt(0) || "").toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-[Marble] text-white">
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : email}
                </div>
                <div className="text-sm text-blue-100 mt-0.5">{email}</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: form */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-[Marble] text-[#52b2bf] mb-3">Personal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-[Marble] text-blue-100">First name</label>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-1 block w-full border border-white/30 rounded-lg px-3 py-2 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#52b2bf]/50 focus:border-[#52b2bf]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-[Marble] text-blue-100">Last name</label>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-1 block w-full border border-white/30 rounded-lg px-3 py-2 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#52b2bf]/50 focus:border-[#52b2bf]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-[Marble] text-blue-100">Date of birth</label>
                        <input
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          placeholder="YYYY-MM-DD"
                          className="mt-1 block w-full border border-white/30 rounded-lg px-3 py-2 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#52b2bf]/50 focus:border-[#52b2bf]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-[Marble] text-blue-100">School</label>
                        <input
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          className="mt-1 block w-full border border-white/30 rounded-lg px-3 py-2 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#52b2bf]/50 focus:border-[#52b2bf]"
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-[Marble] text-[#52b2bf] mb-3">Academic</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-[Marble] text-blue-100">Grade level</label>
                        <input
                          value={gradeLevel}
                          onChange={(e) => setGradeLevel(e.target.value)}
                          className="mt-1 block w-full border border-white/30 rounded-lg px-3 py-2 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#52b2bf]/50 focus:border-[#52b2bf]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-[Marble] text-blue-100">GPA (optional)</label>
                        <input
                          value={gpa}
                          onChange={(e) => setGpa(e.target.value)}
                          placeholder="e.g. 3.5"
                          className="mt-1 block w-full border border-white/30 rounded-lg px-3 py-2 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#52b2bf]/50 focus:border-[#52b2bf]"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Right column: summary */}
              {/* <aside className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Profile summary</h4>
                <dl className="text-sm text-gray-600 space-y-2">
                  <div>
                    <dt className="font-medium text-gray-700">Name</dt>
                    <dd>{(firstName || lastName) ? `${firstName} ${lastName}`.trim() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Email</dt>
                    <dd>{email || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">DOB</dt>
                    <dd>{dateOfBirth || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">School</dt>
                    <dd>{school || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Grade</dt>
                    <dd>{gradeLevel || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">GPA</dt>
                    <dd>{gpa || "—"}</dd>
                  </div>
                </dl>
              </aside> */}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => router.push("/dashboard/student")}
                className="px-6 py-2 rounded-full border border-white/60 text-sm font-[Marble] hover:bg-white/10 transition-all hover:shadow-[0_0_12px_rgba(82,178,191,0.4)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded-full text-sm font-[Marble] transition-all ${saving ? "bg-[#f77fbe]/50 cursor-wait" : "bg-[#f77fbe] hover:bg-[#f77fbe]/90 hover:shadow-[0_0_18px_rgba(247,127,190,0.6)]"}`}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}